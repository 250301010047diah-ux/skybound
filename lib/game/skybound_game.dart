import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flame/game.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'canvas_renderer.dart';
import 'game_audio.dart';
import 'js_runtime.dart';

class GameInput {
  final Map<String, bool> keys = {};
  final Set<String> pressed = {};
  final List<Map<String, dynamic>> actions = [];
  double stickX = 0, stickY = 0;
  bool jumpHeld = false, touch = true, restart = false;
  Map<String, dynamic> aim = {
    'active': false,
    'source': null,
    'dx': 0,
    'dy': 0,
    'mx': 0,
    'my': 0,
  };
  Map<String, dynamic> take() {
    final result = <String, dynamic>{
      'keys': Map.of(keys),
      'pressed': pressed.toList(),
      'actions': List.of(actions),
      'stickX': stickX,
      'stickY': stickY,
      'jumpHeld': jumpHeld,
      'touch': touch,
      'aim': Map.of(aim),
      'restart': restart,
    };
    pressed.clear();
    actions.clear();
    restart = false;
    return result;
  }

  void clear() {
    keys.clear();
    pressed.clear();
    actions.clear();
    stickX = 0;
    stickY = 0;
    jumpHeld = false;
    aim['active'] = false;
  }
}

class SkyboundGame extends FlameGame {
  final input = GameInput();
  final ValueNotifier<Map<String, dynamic>> hud = ValueNotifier({});
  final ValueNotifier<String?> failure = ValueNotifier(null);
  final ValueNotifier<double> loading = ValueNotifier(0);
  final Map<String, ui.Image> art = {};
  final Map<String, Future<void>> _pending = {};
  final Map<String, int> _lastUsed = {};
  final Set<String> _queued = {};
  final List<String> _preloadQueue = [];
  int _preloading = 0;
  // Each decoded sheet is about 12 MB, so this bounds the image memory.
  static const _maxSheets = 36;
  late final GameRuntime _runtime;
  late final CanvasRenderer _renderer;
  late final SharedPreferences _preferences;
  late final GameAudio _audio;
  Map<String, dynamic> catalog = {}, tweaks = {}, worldData = {};
  List<dynamic> _commands = [];
  bool isReady = false, _disposed = false, _runtimeCreated = false;
  int _frame = 0;
  double _hudTimer = 0;
  double _autosaveTimer = 0;
  bool tutorialOpen = false;
  String _lastHud = '';
  Future<void> _saveQueue = Future.value();

  @override
  Color backgroundColor() => const Color(0xff2a3a20);

  @override
  Future<void> onLoad() async {
    await super.onLoad();
    try {
      _preferences = await SharedPreferences.getInstance();
      catalog =
          jsonDecode(await rootBundle.loadString('assets/json/catalog.json'))
              as Map<String, dynamic>;
      tweaks =
          jsonDecode(await rootBundle.loadString('assets/json/tweaks.json'))
              as Map<String, dynamic>;
      final metadata = <String, dynamic>{};
      var count = 0;
      for (final entry in catalog.entries) {
        final v = Map<String, dynamic>.from(entry.value as Map);
        if (v['sidecar'] != null) {
          final data =
              jsonDecode(
                    await rootBundle.loadString('assets/json/${v['sidecar']}'),
                  )
                  as Map;
          v['frames'] = data['frames'];
          v['animations'] = data['animations'] ?? [];
        }
        metadata[entry.key] = v;
        loading.value = 0.05 + 0.2 * (++count / catalog.length);
      }
      if (_disposed) return;
      _runtime = GameRuntime();
      _runtimeCreated = true;
      _runtime.evaluate(
        await rootBundle.loadString('assets/runtime/skybound.js'),
      );
      dynamic saved;
      try {
        saved = jsonDecode(
          _preferences.getString('skybound.save.v1') ?? 'null',
        );
      } catch (_) {
        saved = null;
      }
      final metrics = <String, double>{};
      for (var c = 32; c < 256; c++) {
        final painter = TextPainter(
          text: TextSpan(
            text: String.fromCharCode(c),
            style: const TextStyle(
              fontFamily: 'AeraDisplay',
              fontSize: 100,
              fontWeight: FontWeight.w800,
            ),
          ),
          textDirection: TextDirection.ltr,
        )..layout();
        metrics[String.fromCharCode(c)] = painter.width / 100;
        painter.dispose();
      }
      _runtime.evaluate(
        'skyboundInit(${jsonEncode({'catalog': metadata, 'tweaks': tweaks, 'saved': saved, 'cheat': _preferences.getBool('skybound.cheat') ?? false, 'width': math.max(1, size.x), 'height': math.max(1, size.y), 'metrics': metrics})})',
      );
      await _runtime.flush();
      worldData =
          jsonDecode(_runtime.evaluate('skyboundWorld()'))
              as Map<String, dynamic>;
      final first =
          jsonDecode(
                _runtime.evaluate(
                  'skyboundFrame({},0,${math.max(1, size.x)},${math.max(1, size.y)})',
                ),
              )
              as Map<String, dynamic>;
      // Decode visible art and the active character first. Other regions and
      // costumes stay on disk until a draw command needs them.
      final initialKeys = <String>{'FX_A', 'PROPS_B'};
      for (final command in first['commands'] as List) {
        if (command[0] == 'drawImage') initialKeys.add(command[1] as String);
        if (command[0] == '=' &&
            command[2] is Map &&
            command[2]['kind'] == 'pattern') {
          initialKeys.add(command[2]['image'] as String);
        }
      }
      final activeSkin =
          (first['hud']['skins'] as List).firstWhere(
                (dynamic skin) => skin['id'] == first['hud']['skin'],
              )
              as Map;
      for (final part in ['BASIC', 'AIR', 'ACTION', 'CLIMB', 'BOW', 'MISC']) {
        initialKeys.add('${activeSkin['prefix']}_$part');
      }
      final keys = initialKeys.toList();
      var loaded = 0;
      // Limit simultaneous image decoding to keep mobile peak memory bounded.
      for (var start = 0; start < keys.length; start += 3) {
        await Future.wait(
          keys.skip(start).take(3).map((k) async {
            await _loadImage(k);
            loading.value = 0.25 + 0.75 * (++loaded / keys.length);
          }),
        );
      }
      if (_disposed) return;
      _renderer = CanvasRenderer(art, catalog);
      _audio = gameAudio;
      _commands = first['commands'] as List;
      hud.value = Map<String, dynamic>.from(first['hud'] as Map);
      loading.value = 1;
      isReady = true;
    } catch (error, stack) {
      failure.value = 'Gagal memuat game: $error';
      debugPrint('$error\n$stack');
    }
  }

  // Reads and decodes queued sheets, four at a time, in the background.
  void _startPreloads() {
    while (_preloadQueue.isNotEmpty && _preloading < 4) {
      final key = _preloadQueue.removeAt(0);
      _queued.remove(key);
      if (art.containsKey(key) || _pending.containsKey(key)) continue;
      _preloading++;
      unawaited(
        _loadImage(key)
            .whenComplete(() => _preloading--)
            .catchError((Object _) {
              _pending.remove(key);
            }),
      );
    }
  }

  // Keeps decoded sheets within budget, least recently drawn first. Sheets
  // drawn this frame and Aera's own sheets are never dropped.
  void _evictSheets(Set<String> needed) {
    if (art.length > _maxSheets) {
      final idle = art.keys
          .where((key) => !needed.contains(key) && !_isPlayerSheet(key))
          .toList()
        ..sort((a, b) => (_lastUsed[a] ?? 0).compareTo(_lastUsed[b] ?? 0));
      for (final key in idle) {
        if (art.length <= _maxSheets) break;
        art.remove(key)?.dispose();
        _pending.remove(key);
      }
    }
    _renderer.clearShaders();
  }

  Future<void> _loadImage(String key) {
    if (!catalog.containsKey(key) || art.containsKey(key)) {
      return Future.value();
    }
    return _pending.putIfAbsent(key, () async {
      final entry = catalog[key] as Map;
      final bytes = await rootBundle.load('assets/images/${entry['file']}');
      // Preserve original pixels; only near-area sheets stay resident.
      final codec = await ui.instantiateImageCodec(
        bytes.buffer.asUint8List(bytes.offsetInBytes, bytes.lengthInBytes),
      );
      final image = (await codec.getNextFrame()).image;
      codec.dispose();
      if (_disposed) {
        image.dispose();
        return;
      }
      art[key] = image;
      _lastUsed[key] = _frame;
    });
  }

  @override
  void update(double dt) {
    super.update(dt);
    if (!isReady || _disposed || failure.value != null || tutorialOpen) return;
    try {
      _runtime.pump();
      final result = _runtime.evaluate(
        'skyboundFrame(${jsonEncode(input.take())},${dt.clamp(0.0, 0.1)},${size.x},${size.y})',
      );
      final frame = jsonDecode(result) as Map<String, dynamic>;
      _commands = frame['commands'] as List;
      _frame++;
      final needed = <String>{};
      for (final c in _commands) {
        if (c[0] == 'drawImage') needed.add(c[1] as String);
        if (c[0] == '=' && c[2] is Map && c[2]['kind'] == 'pattern') {
          needed.add(c[2]['image'] as String);
        }
      }
      for (final key in needed) {
        _lastUsed[key] = _frame;
        if (!art.containsKey(key)) {
          unawaited(
            _loadImage(key).catchError((Object e) {
              failure.value = 'Aset $key gagal dimuat: $e';
            }),
          );
        }
      }
      // The runtime lists the sheets it expects soon (nearby areas, the skin
      // being worn, enemies, bosses). Decode them before their first draw.
      for (final key in (frame['required'] as List? ?? const []).cast<String>()) {
        if (art.containsKey(key) || _pending.containsKey(key)) continue;
        if (!_queued.add(key)) continue;
        // Aera and the worn skin come first: their poses must not wait.
        if (key.startsWith('AERA_') || key.startsWith('SKIN_')) {
          _preloadQueue.insert(0, key);
        } else {
          _preloadQueue.add(key);
        }
      }
      _startPreloads();
      if (_frame % 60 == 0) _evictSheets(needed);
      _hudTimer += dt;
      final next = frame['hud'] as Map<String, dynamic>;
      if (_hudTimer >= 1 / 15 ||
          next['menu'] != hud.value['menu'] ||
          next['dialog'] != hud.value['dialog']) {
        _hudTimer = 0;
        final signature = jsonEncode(next);
        if (signature != _lastHud) {
          _lastHud = signature;
          hud.value = next;
        }
      }
      if (frame['save'] != null) _persist(frame['save']);
      if (frame['haptic'] == true) unawaited(HapticFeedback.lightImpact());
      _audio.sync(frame, tweaks);
      _autosaveTimer += dt;
      if (_autosaveTimer >= 15) {
        _autosaveTimer = 0;
        unawaited(save());
      }
    } catch (error, stack) {
      failure.value = 'Game berhenti: $error';
      debugPrint('$error\n$stack');
    }
  }

  // Aera's default sheets and the sheets of the skin being worn.
  bool _isPlayerSheet(String key) {
    if (key.startsWith('AERA_')) return true;
    final skins = hud.value['skins'] as List? ?? const [];
    for (final skin in skins) {
      if (skin is Map &&
          skin['id'] == hud.value['skin'] &&
          key.startsWith('${skin['prefix']}_')) {
        return true;
      }
    }
    return false;
  }

  void _persist(dynamic save) {
    final value = jsonEncode(save);
    _saveQueue = _saveQueue
        .then((_) async {
          if (save is Map && save['clear'] == true) {
            await _preferences.remove('skybound.save.v1');
          } else {
            await _preferences.setString('skybound.save.v1', value);
          }
        })
        .catchError((Object e) {
          debugPrint('Save failed: $e');
        });
  }

  Future<void> save() async {
    if (isReady) {
      _persist(jsonDecode(_runtime.evaluate('skyboundSnapshot()')));
      await _saveQueue;
    }
  }

  void suspend() {
    input.clear();
    if (isReady) {
      unawaited(save());
      _audio.pause();
    }
    pauseEngine();
  }

  void setTutorial(bool value) {
    tutorialOpen = value;
    input.clear();
    if (value && isReady) _audio.pause();
  }

  void resume() {
    if (!_disposed) resumeEngine();
  }

  void action(String type, [Map<String, dynamic> args = const {}]) =>
      input.actions.add({'type': type, ...args});
  @override
  void render(Canvas canvas) {
    super.render(canvas);
    if (isReady && !_disposed) _renderer.render(canvas, _commands);
  }

  @override
  void onRemove() {
    _disposed = true;
    if (isReady) {
      _persist(jsonDecode(_runtime.evaluate('skyboundSnapshot()')));
      _renderer.dispose();
    }
    if (_runtimeCreated) _runtime.dispose();
    for (final image in art.values) {
      image.dispose();
    }
    art.clear();
    super.onRemove();
  }
}
