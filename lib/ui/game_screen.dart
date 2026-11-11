import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flame/game.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../game/canvas_renderer.dart';
import '../game/skybound_game.dart';
import 'theme.dart';
import 'tutorial.dart';

part 'control_icons.dart';

const ink = Sky.ink,
    cream = Color(0xfffff3c4),
    wood = Color(0xff6b4528),
    woodHi = Color(0xff8a5a33),
    leaf = Color(0xff7ed957);

class GameScreen extends StatefulWidget {
  const GameScreen({super.key, this.onExit});
  final Future<void> Function()? onExit;
  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with WidgetsBindingObserver {
  late SkyboundGame game;
  bool _tutorial = true;
  final _focus = FocusNode();
  @override
  void initState() {
    super.initState();
    game = SkyboundGame()..setTutorial(true);
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _focus.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      game.resume();
    } else {
      game.suspend();
    }
  }

  KeyEventResult _key(FocusNode node, KeyEvent event) {
    if (_tutorial) {
      if (event is KeyDownEvent &&
          event.logicalKey == LogicalKeyboardKey.escape) {
        _closeTutorial();
      }
      return KeyEventResult.handled;
    }
    final i = game.input, key = event.logicalKey;
    final down = event is KeyDownEvent, up = event is KeyUpEvent;
    final directions = {
      LogicalKeyboardKey.keyA: 'left',
      LogicalKeyboardKey.arrowLeft: 'left',
      LogicalKeyboardKey.keyD: 'right',
      LogicalKeyboardKey.arrowRight: 'right',
      LogicalKeyboardKey.keyW: 'up',
      LogicalKeyboardKey.arrowUp: 'up',
      LogicalKeyboardKey.keyS: 'down',
      LogicalKeyboardKey.arrowDown: 'down',
    };
    if (directions.containsKey(key)) {
      i.keys[directions[key]!] = !up;
      return KeyEventResult.handled;
    }
    if (key == LogicalKeyboardKey.space) {
      i.jumpHeld = !up;
      if (down) i.pressed.addAll(['jumpPressed', 'advancePressed']);
    } else if ([
      LogicalKeyboardKey.shiftLeft,
      LogicalKeyboardKey.shiftRight,
      LogicalKeyboardKey.keyL,
    ].contains(key)) {
      if (down) i.pressed.add('dashPressed');
    } else if ([
      LogicalKeyboardKey.keyE,
      LogicalKeyboardKey.enter,
    ].contains(key)) {
      if (down) i.pressed.addAll(['interactPressed', 'advancePressed']);
    } else if ([
      LogicalKeyboardKey.keyQ,
      LogicalKeyboardKey.tab,
    ].contains(key)) {
      if (down) i.pressed.add('cyclePressed');
    } else if ([
      LogicalKeyboardKey.escape,
      LogicalKeyboardKey.keyP,
    ].contains(key)) {
      if (down) i.pressed.add('pausePressed');
    } else if ([
      LogicalKeyboardKey.keyJ,
      LogicalKeyboardKey.keyK,
    ].contains(key)) {
      if (down) {
        i.aim['active'] = true;
        i.aim['source'] = 'keys';
      }
      if (up) {
        i.aim['active'] = false;
        i.pressed.add('fireReleased');
      }
    } else {
      return KeyEventResult.ignored;
    }
    return KeyEventResult.handled;
  }

  void _mouse(PointerEvent e, bool? active) {
    if (e.kind != PointerDeviceKind.mouse) return;
    if (active == true && e.buttons != kPrimaryMouseButton) return;
    final i = game.input;
    i.aim['mx'] = e.localPosition.dx;
    i.aim['my'] = e.localPosition.dy;
    if (active != null) {
      i.aim['active'] = active;
      i.aim['source'] = 'mouse';
      if (active) {
        i.pressed.add('advancePressed');
      } else {
        i.pressed.add('fireReleased');
      }
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: false,
    onPopInvokedWithResult: (popped, result) {
      if (!popped) {
        if (_tutorial) {
          _closeTutorial();
        } else {
          game.input.pressed.add('pausePressed');
        }
      }
    },
    child: Scaffold(
      backgroundColor: Sky.night,
      body: Focus(
        focusNode: _focus,
        autofocus: true,
        onKeyEvent: _key,
        child: SafeArea(
          child: Stack(
            children: [
              Positioned.fill(
                child: Listener(
                  onPointerDown: (e) {
                    _focus.requestFocus();
                    _mouse(e, true);
                  },
                  onPointerMove: (e) => _mouse(e, null),
                  onPointerHover: (e) => _mouse(e, null),
                  onPointerUp: (e) => _mouse(e, false),
                  onPointerCancel: (e) => _mouse(e, false),
                  child: GameWidget<SkyboundGame>(
                    key: ObjectKey(game),
                    game: game,
                  ),
                ),
              ),
              Positioned.fill(
                child: ValueListenableBuilder<Map<String, dynamic>>(
                  valueListenable: game.hud,
                  builder: (context, hud, _) => hud.isEmpty
                      ? const SizedBox.shrink()
                      : GameHud(
                          game: game,
                          hud: hud,
                          onTutorial: _showTutorial,
                          onExit: widget.onExit == null ? null : _exit,
                        ),
                ),
              ),
              Positioned.fill(
                child: ValueListenableBuilder<double>(
                  valueListenable: game.loading,
                  builder: (context, value, _) => value >= 1
                      ? const SizedBox.shrink()
                      : LoadingScreen(value: value),
                ),
              ),
              Positioned.fill(
                child: ValueListenableBuilder<String?>(
                  valueListenable: game.failure,
                  builder: (context, error, _) => error == null
                      ? const SizedBox.shrink()
                      : _FailureScreen(
                          error: error,
                          onRetry: () {
                            game.suspend();
                            setState(
                              () =>
                                  game = SkyboundGame()..setTutorial(_tutorial),
                            );
                          },
                        ),
                ),
              ),
              if (_tutorial)
                Positioned.fill(child: TutorialOverlay(onDone: _closeTutorial)),
            ],
          ),
        ),
      ),
    ),
  );

  void _showTutorial() {
    game.setTutorial(true);
    setState(() => _tutorial = true);
  }

  void _closeTutorial() {
    game.setTutorial(false);
    setState(() => _tutorial = false);
    _focus.requestFocus();
  }

  Future<void> _exit() async {
    game.input.clear();
    await game.save();
    if (mounted) await widget.onExit?.call();
  }
}

/// Streaming the world in takes a moment on first launch; the wait gets the
/// logo, a real progress bar and something to read.
class LoadingScreen extends StatelessWidget {
  const LoadingScreen({super.key, required this.value});
  final double value;
  static const _tips = [
    'Altar menyimpan checkpoint — aktifkan sebelum melangkah jauh.',
    'Tahan busur di udara untuk melambatkan waktu dengan Fokus Langit.',
    'Setiap panah meninggalkan jejak berbeda. Perhatikan warnanya.',
    'Panah Benang mengikat jangkar: bergelayut dan berayun melewati jurang.',
  ];
  @override
  Widget build(BuildContext context) => SkyBackdrop(
    motes: 18,
    child: Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 330),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Sky.leaf.withValues(alpha: .3),
                      blurRadius: 60,
                      spreadRadius: 4,
                    ),
                  ],
                ),
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 104,
                  height: 104,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'Aera Skybound Roots',
                textAlign: TextAlign.center,
                style: Sky.title(23),
              ),
              const SizedBox(height: 18),
              Meter(value: value, color: Sky.leaf, height: 10),
              const SizedBox(height: 10),
              Text(
                'Menumbuhkan Pohon Langit… ${(value * 100).clamp(0, 100).round()}%',
                style: Sky.eyebrow(Sky.textSoft),
              ),
              const SizedBox(height: 22),
              Text(
                _tips[(value * _tips.length)
                    .clamp(0, _tips.length - 1)
                    .floor()],
                textAlign: TextAlign.center,
                style: Sky.body(Sky.textSoft.withValues(alpha: .8), 13),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _FailureScreen extends StatelessWidget {
  const _FailureScreen({required this.error, required this.onRetry});
  final String error;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => ColoredBox(
    color: Sky.night,
    child: Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 380),
          child: GlassCard(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  color: Sky.ember,
                  size: 42,
                ),
                const SizedBox(height: 14),
                Text(
                  error,
                  textAlign: TextAlign.center,
                  style: Sky.body(Sky.text, 14),
                ),
                const SizedBox(height: 18),
                SkyButton(
                  label: 'Coba lagi',
                  icon: Icons.refresh_rounded,
                  kind: SkyButtonKind.primary,
                  onTap: onRetry,
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}

class GameHud extends StatelessWidget {
  const GameHud({
    super.key,
    required this.game,
    required this.hud,
    this.onTutorial,
    this.onExit,
  });
  final SkyboundGame game;
  final Map<String, dynamic> hud;
  final VoidCallback? onTutorial;
  final Future<void> Function()? onExit;
  void press(String flag) => game.input.pressed.add(flag);
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) {
      final short = math.min(box.maxWidth, box.maxHeight),
          pad = (short * .02).clamp(6.0, 14.0);
      final menu = hud['menu'], dialog = hud['dialog'] as Map?;
      return Stack(
        children: [
          Positioned(
            top: pad,
            left: pad,
            child: IgnorePointer(
              child: VitalsPanel(hud: hud, short: short),
            ),
          ),
          Positioned(
            top: pad,
            right: pad,
            child: ControlCluster(
              game: game,
              hud: hud,
              onTutorial: onTutorial,
              press: press,
            ),
          ),
          Positioned(
            top: box.maxWidth < 600 ? 86 : pad,
            left: box.maxWidth * .2,
            right: box.maxWidth * .2,
            child: IgnorePointer(
              child: Column(
                children: [
                  if ((hud['banner'] as String).isNotEmpty)
                    OutlineText(
                      hud['banner'] as String,
                      size: (short * .05).clamp(16.0, 30.0),
                    ),
                  if (hud['boss'] != null) ...[
                    const SizedBox(height: 4),
                    BossBar(boss: hud['boss'] as Map),
                  ],
                  if ((hud['toast'] as String).isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Toast(
                        text: hud['toast'] as String,
                        size: (short * .034).clamp(12.0, 15.0),
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (menu == null && dialog == null) ...[
            Positioned(
              left: (short * .03).clamp(8.0, 24.0),
              bottom: (short * .03).clamp(8.0, 24.0),
              child: VirtualStick(
                game: game,
                size: (short * .30).clamp(108.0, 150.0),
              ),
            ),
            Positioned(
              right: (short * .03).clamp(8.0, 24.0),
              bottom: (short * .03).clamp(8.0, 24.0),
              child: ActionPad(
                game: game,
                short: short,
                interact: hud['interact'] as String,
              ),
            ),
          ],
          if (dialog != null)
            Positioned(
              left: box.maxWidth * .05,
              right: box.maxWidth * .05,
              bottom: math.max(16, box.maxHeight * .05),
              child: DialogPanel(
                dialog: dialog,
                onAdvance: () => press('advancePressed'),
              ),
            ),
          if (menu != null)
            Positioned.fill(
              child: GameMenu(game: game, hud: hud, onExit: onExit),
            ),
        ],
      );
    },
  );
}

/// Health, arrow energy and Sky Focus, read left to right in that order of
/// urgency. The meters carry their own icon so neither needs a caption.
class VitalsPanel extends StatelessWidget {
  const VitalsPanel({super.key, required this.hud, required this.short});
  final Map<String, dynamic> hud;
  final double short;
  @override
  Widget build(BuildContext context) {
    final hp = (hud['hp'] as num).toDouble();
    return SizedBox(
      width: (short * .30).clamp(104.0, 178.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 2,
            children: List.generate(
              (hud['maxHp'] as num).toInt(),
              (i) => AnimatedScale(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutBack,
                scale: i < hp ? 1 : .82,
                child: CustomPaint(
                  size: Size.square((short * .054).clamp(18.0, 28.0)),
                  painter: LeafPainter(active: i < hp),
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          _MeterRow(
            icon: Icons.bolt_rounded,
            color: Sky.leaf,
            value: (hud['energy'] as num) / 100,
          ),
          const SizedBox(height: 4),
          _MeterRow(
            icon: Icons.hourglass_bottom_rounded,
            color: Sky.sky,
            value: (hud['focus'] as num) / (hud['focusMax'] as num),
            dim: (hud['slowmo'] != true),
          ),
        ],
      ),
    );
  }
}

class _MeterRow extends StatelessWidget {
  const _MeterRow({
    required this.icon,
    required this.color,
    required this.value,
    this.dim = false,
  });
  final IconData icon;
  final Color color;
  final double value;
  final bool dim;
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(
        icon,
        size: 13,
        color: color.withValues(alpha: dim ? .55 : 1),
        shadows: const [Shadow(color: Colors.black54, blurRadius: 3)],
      ),
      const SizedBox(width: 4),
      Expanded(
        child: Meter(value: value, color: color, height: 7),
      ),
    ],
  );
}

/// Top-right controls, gathered on one bar so they read as a single toolbar
/// rather than four loose buttons over the world.
class ControlCluster extends StatelessWidget {
  const ControlCluster({
    super.key,
    required this.game,
    required this.hud,
    required this.press,
    this.onTutorial,
  });
  final SkyboundGame game;
  final Map<String, dynamic> hud;
  final void Function(String) press;
  final VoidCallback? onTutorial;
  @override
  Widget build(BuildContext context) {
    final muted = hud['settings']['mute'] == true;
    return Row(
      children: [
        ArrowChip(hud: hud, onTap: () => press('cyclePressed')),
        const SizedBox(width: 6),
        GameButton(
          label: muted ? 'Aktifkan suara' : 'Bisukan suara',
          icon: muted ? Icons.volume_off : Icons.volume_up,
          onDown: () => game.action(
            'settings',
            Map<String, dynamic>.from(hud['settings'] as Map)
              ..['mute'] = !muted,
          ),
        ),
        const SizedBox(width: 6),
        GameButton(
          label: 'Tutorial',
          icon: Icons.help_outline,
          onDown: onTutorial ?? () {},
        ),
        const SizedBox(width: 6),
        GameButton(
          label: 'Jeda',
          icon: Icons.pause,
          onDown: () => press('pausePressed'),
        ),
      ],
    );
  }
}

/// The equipped arrow: its colour, its initial and its name, so switching mid
/// fight does not mean reading a menu.
class ArrowChip extends StatelessWidget {
  const ArrowChip({super.key, required this.hud, required this.onTap});
  final Map<String, dynamic> hud;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final color = parseColor(hud['arrowColor']);
    final kind = hud['arrow'].toString();
    return Semantics(
      label: hud['arrowName'] as String,
      button: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Container(
          height: 44,
          padding: const EdgeInsets.symmetric(horizontal: 9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Sky.ink, width: 2.5),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color.lerp(color, Colors.white, .1)!.withValues(alpha: .4),
                Colors.black.withValues(alpha: .55),
              ],
            ),
            boxShadow: Sky.lift(.6),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 18,
                height: 18,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: color,
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(alpha: .7),
                      blurRadius: 9,
                    ),
                  ],
                ),
                child: Center(
                  child: Text(
                    kind == 'normal' ? '∞' : kind.substring(0, 1).toUpperCase(),
                    style: const TextStyle(
                      fontSize: 10,
                      height: 1,
                      fontWeight: FontWeight.w800,
                      color: Sky.ink,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              CustomPaint(
                size: const Size.square(18),
                painter: ControlIconPainter(Icons.north_east, cream),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Boss health: a name plate over a segmented bar, so the remaining hits read
/// as discrete chunks rather than a sliding percentage.
class BossBar extends StatelessWidget {
  const BossBar({super.key, required this.boss});
  final Map boss;
  @override
  Widget build(BuildContext context) {
    final hp = (boss['hp'] as num).toDouble();
    final max = math.max(1, (boss['max'] as num).toDouble());
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 3),
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: .6),
            borderRadius: Sky.pillRadius,
            border: Border.all(color: Sky.ember.withValues(alpha: .6)),
          ),
          child: Text(
            (boss['name'] as String).toUpperCase(),
            style: Sky.eyebrow(const Color(0xffffd9c8)),
          ),
        ),
        const SizedBox(height: 5),
        SizedBox(
          height: 12,
          child: CustomPaint(
            painter: _BossMeter(hp / max, max.toInt()),
            child: const SizedBox(width: double.infinity),
          ),
        ),
      ],
    );
  }
}

class _BossMeter extends CustomPainter {
  _BossMeter(this.value, this.segments);
  final double value;
  final int segments;
  @override
  void paint(Canvas canvas, Size size) {
    final body = RRect.fromRectAndRadius(
      Offset.zero & size,
      const Radius.circular(6),
    );
    canvas.drawRRect(
      body,
      Paint()..color = Colors.black.withValues(alpha: .62),
    );
    canvas.save();
    canvas.clipRRect(body);
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width * value.clamp(0, 1), size.height),
      Paint()
        ..shader = ui.Gradient.linear(Offset.zero, Offset(0, size.height), [
          const Color(0xffffb27a),
          Sky.ember,
        ]),
    );
    // Notches, one per hit the boss still has to take.
    if (segments > 1 && segments <= 40) {
      final tick = Paint()
        ..color = Colors.black.withValues(alpha: .45)
        ..strokeWidth = 1.2;
      for (var i = 1; i < segments; i++) {
        final x = size.width * i / segments;
        canvas.drawLine(Offset(x, 0), Offset(x, size.height), tick);
      }
    }
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height * .4),
      Paint()..color = Colors.white.withValues(alpha: .14),
    );
    canvas.restore();
    canvas.drawRRect(
      body,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..color = Sky.ink,
    );
  }

  @override
  bool shouldRepaint(_BossMeter old) =>
      old.value != value || old.segments != segments;
}

class Toast extends StatelessWidget {
  const Toast({super.key, required this.text, this.size = 13});
  final String text;
  final double size;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
    decoration: BoxDecoration(
      color: Colors.black.withValues(alpha: .72),
      border: Border.all(color: Sky.amber.withValues(alpha: .4), width: 1.5),
      borderRadius: BorderRadius.circular(12),
      boxShadow: Sky.lift(.6),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.auto_awesome_rounded, size: 13, color: Sky.amber),
        const SizedBox(width: 7),
        Flexible(
          child: Text(
            text,
            textAlign: TextAlign.center,
            style: Sky.body(Sky.text, size),
          ),
        ),
      ],
    ),
  );
}

/// Story panel: a parchment card with the speaker on a plate above it, and a
/// chevron that keeps nudging until you advance.
class DialogPanel extends StatelessWidget {
  const DialogPanel({super.key, required this.dialog, required this.onAdvance});
  final Map dialog;
  final VoidCallback onAdvance;
  @override
  Widget build(BuildContext context) {
    final lines = dialog['lines'] as List;
    final index = (dialog['i'] as int).clamp(0, lines.length - 1);
    return GestureDetector(
      onTap: onAdvance,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 760),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(left: 14),
              padding: const EdgeInsets.fromLTRB(14, 6, 16, 6),
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(14),
                  bottom: Radius.zero,
                ),
                gradient: const LinearGradient(
                  colors: [Color(0xff8a5a33), Color(0xff6b4528)],
                ),
                border: Border.all(color: const Color(0xff3c2412), width: 2),
                boxShadow: Sky.lift(.5),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.chat_bubble_rounded,
                    size: 13,
                    color: Sky.amber,
                  ),
                  const SizedBox(width: 7),
                  Text(
                    dialog['name'] as String,
                    style: const TextStyle(
                      fontFamily: Sky.display,
                      color: Color(0xfffff0cc),
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            ParchmentPanel(
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    lines[index] as String,
                    style: const TextStyle(
                      fontFamily: Sky.display,
                      color: Sky.ink,
                      fontSize: 17,
                      height: 1.38,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Text(
                        '${index + 1}/${lines.length}',
                        style: const TextStyle(
                          fontFamily: Sky.display,
                          color: Sky.inkSoft,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      const _Nudge(),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Nudge extends StatefulWidget {
  const _Nudge();
  @override
  State<_Nudge> createState() => _NudgeState();
}

class _NudgeState extends State<_Nudge> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1100),
  )..repeat();
  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _c,
    builder: (context, _) => Transform.translate(
      offset: Offset(math.sin(_c.value * math.pi * 2) * 3, 0),
      child: const Icon(Icons.play_arrow_rounded, color: Sky.ink, size: 20),
    ),
  );
}

class OutlineText extends StatelessWidget {
  const OutlineText(this.text, {super.key, this.size = 24});
  final String text;
  final double size;
  @override
  Widget build(BuildContext context) => Stack(
    children: [
      Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(
          fontFamily: Sky.display,
          fontSize: size,
          fontWeight: FontWeight.w800,
          height: 1.1,
          foreground: Paint()
            ..style = PaintingStyle.stroke
            ..strokeWidth = 5
            ..strokeJoin = StrokeJoin.round
            ..color = ink,
        ),
      ),
      ShaderMask(
        shaderCallback: (rect) => const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.white, Sky.amber],
        ).createShader(rect),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: Sky.display,
            fontSize: size,
            fontWeight: FontWeight.w800,
            height: 1.1,
            color: cream,
          ),
        ),
      ),
    ],
  );
}

class Meter extends StatelessWidget {
  const Meter({
    super.key,
    required this.value,
    required this.color,
    this.height = 8,
  });
  final double value, height;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    height: height,
    decoration: BoxDecoration(
      color: Colors.black.withValues(alpha: .6),
      border: Border.all(color: ink, width: 1.8),
      borderRadius: BorderRadius.circular(height),
      boxShadow: Sky.lift(.4),
    ),
    clipBehavior: Clip.antiAlias,
    child: Align(
      alignment: Alignment.centerLeft,
      child: AnimatedFractionallySizedBox(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        widthFactor: value.clamp(0.0, 1.0),
        heightFactor: 1,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color.lerp(color, Colors.white, .45)!,
                color,
                Color.lerp(color, Colors.black, .2)!,
              ],
              stops: const [0, .55, 1],
            ),
          ),
        ),
      ),
    ),
  );
}

class LeafPainter extends CustomPainter {
  LeafPainter({required this.active});
  final bool active;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24, size.height / 24);
    final path = Path()
      ..moveTo(5, 19)
      ..cubicTo(5, 10, 11, 4, 20, 4)
      ..cubicTo(20, 13, 14, 19, 5, 19)
      ..close();
    if (active) {
      canvas.drawPath(
        path,
        Paint()
          ..color = leaf.withValues(alpha: .5)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
      );
    }
    canvas.drawPath(
      path,
      Paint()
        ..shader = active
            ? ui.Gradient.linear(const Offset(5, 4), const Offset(20, 19), [
                const Color(0xffbdf78a),
                const Color(0xff4e9a28),
              ])
            : null
        ..color = active ? Colors.white : const Color(0xff4b3b2a),
    );
    canvas.drawPath(
      path,
      Paint()
        ..color = ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.8,
    );
    canvas.drawLine(
      const Offset(6, 18),
      const Offset(15, 9),
      Paint()
        ..color = active ? const Color(0x992a170b) : ink
        ..strokeWidth = 1.5,
    );
  }

  @override
  bool shouldRepaint(LeafPainter old) => old.active != active;
}

class GameButton extends StatefulWidget {
  const GameButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onDown,
    this.onUp,
    this.onMove,
    this.width = 44,
    this.height = 44,
    this.round = false,
    this.color = cream,
    this.badge,
  });
  final String label;
  final IconData icon;
  final VoidCallback onDown;
  final VoidCallback? onUp;
  final ValueChanged<Offset>? onMove;
  final double width, height;
  final bool round;
  final Color color;
  final String? badge;
  @override
  State<GameButton> createState() => _GameButtonState();
}

class _GameButtonState extends State<GameButton> {
  int? pointer;
  Offset origin = Offset.zero;
  @override
  void dispose() {
    if (pointer != null) widget.onUp?.call();
    super.dispose();
  }

  void release(PointerEvent e) {
    if (e.pointer != pointer) return;
    setState(() => pointer = null);
    widget.onUp?.call();
  }

  bool get _accent => widget.icon == Icons.my_location;

  @override
  Widget build(BuildContext context) {
    final down = pointer != null;
    return Semantics(
      label: widget.label,
      button: true,
      child: Listener(
        onPointerDown: (e) {
          if (pointer != null) return;
          setState(() => pointer = e.pointer);
          origin = e.position;
          widget.onDown();
        },
        onPointerMove: (e) {
          if (e.pointer == pointer) widget.onMove?.call(e.position - origin);
        },
        onPointerUp: release,
        onPointerCancel: release,
        child: AnimatedScale(
          duration: const Duration(milliseconds: 80),
          scale: down ? .94 : 1,
          child: Container(
            width: widget.width,
            height: widget.height,
            decoration: BoxDecoration(
              shape: widget.round ? BoxShape.circle : BoxShape.rectangle,
              borderRadius: widget.round ? null : BorderRadius.circular(12),
              border: Border.all(color: ink, width: 2.8),
              gradient: RadialGradient(
                center: const Alignment(-.35, -.45),
                radius: 1.1,
                colors: _accent
                    ? const [Color(0xffa6ef6d), Color(0xff3f7a1c)]
                    : down
                    ? const [Color(0xff6f4a2c), Color(0xff4a3019)]
                    : const [Color(0xff9a6a3f), Color(0xff5c3a20)],
              ),
              boxShadow: down
                  ? null
                  : [
                      BoxShadow(
                        color: ink.withValues(alpha: .55),
                        blurRadius: 5,
                        offset: const Offset(0, 3),
                      ),
                      if (_accent)
                        BoxShadow(
                          color: leaf.withValues(alpha: .35),
                          blurRadius: 16,
                          spreadRadius: 1,
                        ),
                    ],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Glass highlight across the top half of the cap.
                Positioned(
                  top: 2,
                  left: 5,
                  right: 5,
                  height: widget.height * .34,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(widget.height),
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.white.withValues(alpha: down ? .1 : .22),
                          Colors.white.withValues(alpha: 0),
                        ],
                      ),
                    ),
                  ),
                ),
                if (widget.icon == Icons.volume_off ||
                    widget.icon == Icons.volume_up ||
                    widget.icon == Icons.help_outline)
                  Icon(widget.icon, color: widget.color, size: 23)
                else
                  CustomPaint(
                    size: Size.square(widget.round ? widget.width * .52 : 23),
                    painter: ControlIconPainter(widget.icon, widget.color),
                  ),
                if (widget.badge != null)
                  Positioned(
                    right: 3,
                    bottom: 1,
                    child: Text(
                      widget.badge!,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: cream,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class VirtualStick extends StatefulWidget {
  const VirtualStick({super.key, required this.game, required this.size});
  final SkyboundGame game;
  final double size;
  @override
  State<VirtualStick> createState() => _VirtualStickState();
}

class _VirtualStickState extends State<VirtualStick> {
  int? pointer;
  Offset knob = Offset.zero;
  void move(PointerEvent e) {
    if (e.pointer != pointer) return;
    var offset = e.localPosition - Offset(widget.size / 2, widget.size / 2);
    final radius = widget.size * .42;
    if (offset.distance > radius) offset = offset / offset.distance * radius;
    final nx = offset.dx / radius, ny = offset.dy / radius;
    widget.game.input.stickX = nx.abs() > .28
        ? nx.sign * math.min(1, (nx.abs() - .18) / .6)
        : 0;
    widget.game.input.stickY = ny.abs() > .45 ? ny.sign : 0;
    setState(() => knob = offset);
  }

  void release(PointerEvent e) {
    if (pointer != e.pointer) return;
    pointer = null;
    widget.game.input.stickX = 0;
    widget.game.input.stickY = 0;
    setState(() => knob = Offset.zero);
  }

  @override
  void dispose() {
    widget.game.input.stickX = 0;
    widget.game.input.stickY = 0;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Joystick gerak dan panjat',
    child: Listener(
      onPointerDown: (e) {
        if (pointer != null) return;
        pointer = e.pointer;
        move(e);
      },
      onPointerMove: move,
      onPointerUp: release,
      onPointerCancel: release,
      child: Container(
        width: widget.size,
        height: widget.size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: cream.withValues(alpha: .6), width: 2.5),
          gradient: RadialGradient(
            colors: [
              Colors.white.withValues(alpha: .12),
              Colors.black.withValues(alpha: .38),
            ],
          ),
          boxShadow: Sky.lift(.5),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            CustomPaint(
              size: Size.square(widget.size),
              painter: _StickRose(knob),
            ),
            Transform.translate(
              offset: knob,
              child: Container(
                width: widget.size * .44,
                height: widget.size * .44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: ink, width: 3),
                  gradient: const RadialGradient(
                    center: Alignment(-.3, -.4),
                    colors: [Color(0xfffffaea), Color(0xffcbb88c)],
                  ),
                  boxShadow: Sky.lift(.6),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

/// Four faint direction marks under the knob, lit on the side being pushed.
class _StickRose extends CustomPainter {
  _StickRose(this.knob);
  final Offset knob;
  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = size.width * .36;
    for (var i = 0; i < 4; i++) {
      final angle = i * math.pi / 2;
      final dir = Offset(math.cos(angle), math.sin(angle));
      final lit =
          knob.distance > 4 && (knob / knob.distance - dir).distance < .8;
      canvas.drawCircle(
        c + dir * r,
        2.4,
        Paint()..color = (lit ? leaf : cream).withValues(alpha: lit ? .95 : .3),
      );
    }
  }

  @override
  bool shouldRepaint(_StickRose old) => old.knob != knob;
}

class ActionPad extends StatelessWidget {
  const ActionPad({
    super.key,
    required this.game,
    required this.short,
    required this.interact,
  });
  final SkyboundGame game;
  final double short;
  final String interact;
  @override
  Widget build(BuildContext context) {
    final big = (short * .18).clamp(64.0, 86.0),
        small = (short * .13).clamp(48.0, 62.0),
        gap = (short * .03).clamp(12.0, 18.0),
        i = game.input;
    return SizedBox(
      width: big + small + gap,
      height: big + small + gap,
      child: Stack(
        children: [
          Positioned(
            right: big + gap * .6,
            bottom: big + gap * .6,
            child: GameButton(
              label: interact.isEmpty ? 'Interaksi' : interact,
              icon: Icons.pan_tool_alt,
              width: math.max(44, small * .86),
              height: math.max(44, small * .86),
              round: true,
              color: interact.isEmpty ? cream : leaf,
              onDown: () =>
                  i.pressed.addAll(['interactPressed', 'advancePressed']),
            ),
          ),
          Positioned(
            right: big + gap,
            bottom: (big - small) / 2,
            child: GameButton(
              label: 'Dash',
              icon: Icons.double_arrow,
              width: small,
              height: small,
              round: true,
              onDown: () => i.pressed.add('dashPressed'),
            ),
          ),
          Positioned(
            bottom: big + gap,
            right: (big - small) / 2,
            child: GameButton(
              label: 'Lompat',
              icon: Icons.arrow_upward,
              width: small,
              height: small,
              round: true,
              onDown: () {
                i.jumpHeld = true;
                i.pressed.addAll(['jumpPressed', 'advancePressed']);
              },
              onUp: () => i.jumpHeld = false,
            ),
          ),
          Positioned(
            bottom: 0,
            right: 0,
            child: GameButton(
              label: 'Busur: tahan, geser, lepas',
              icon: Icons.my_location,
              width: big,
              height: big,
              round: true,
              onDown: () {
                i.aim = {
                  'active': true,
                  'source': 'button',
                  'dx': 0,
                  'dy': 0,
                  'mx': 0,
                  'my': 0,
                };
              },
              onMove: (d) {
                i.aim['dx'] = d.dx;
                i.aim['dy'] = d.dy;
              },
              onUp: () {
                i.aim['active'] = false;
                i.pressed.add('fireReleased');
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Kept for compatibility with anything still asking for the old panel; it now
/// draws the shared parchment.
class WoodPanel extends StatelessWidget {
  const WoodPanel({super.key, required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) => ParchmentPanel(child: child);
}

class GameMenu extends StatefulWidget {
  const GameMenu({
    super.key,
    required this.game,
    required this.hud,
    this.onExit,
  });
  final SkyboundGame game;
  final Map<String, dynamic> hud;
  final Future<void> Function()? onExit;
  @override
  State<GameMenu> createState() => _GameMenuState();
}

class _GameMenuState extends State<GameMenu> {
  int tab = 0;
  bool confirm = false;
  SkyboundGame get game => widget.game;
  Map<String, dynamic> get h => widget.hud;

  /// Small parchment-side button, used inside the pause tabs.
  Widget button(String text, VoidCallback action, {bool danger = false}) =>
      _InkButton(label: text, onTap: action, danger: danger);

  @override
  Widget build(BuildContext context) => Stack(
    children: [
      Positioned.fill(
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 6, sigmaY: 6),
          child: ColoredBox(color: Colors.black.withValues(alpha: .5)),
        ),
      ),
      Center(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: 700,
            maxHeight: MediaQuery.sizeOf(context).height * .91,
          ),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: ParchmentPanel(
              padding: const EdgeInsets.all(16),
              child: h['menu'] == 'pause'
                  ? _pause()
                  : h['menu'] == 'travel'
                  ? _travel()
                  : _ending(),
            ),
          ),
        ),
      ),
    ],
  );

  Widget _pause() => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Row(
        children: [
          const Icon(Icons.park_rounded, color: Sky.leafDeep, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '${(h['area'] as int) + 1}/13 · ${h['areaName']}',
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontFamily: Sky.display,
                color: Sky.ink,
                fontWeight: FontWeight.w800,
                fontSize: 15,
              ),
            ),
          ),
          _Pill(
            icon: Icons.eco_rounded,
            text: '${h['seeds']}/${h['seedTotal']}',
          ),
          const SizedBox(width: 6),
          _Pill(
            icon: Icons.filter_drama_rounded,
            text: '${h['feathers']}/${h['featherTotal']}',
          ),
        ],
      ),
      const LeafDivider(),
      SegmentedTabs(
        labels: const ['Peta', 'Bantuan', 'Jubah', 'Suara'],
        index: tab,
        onChanged: (i) => setState(() => tab = i),
      ),
      const SizedBox(height: 12),
      Flexible(
        child: switch (tab) {
          0 => _map(),
          1 => _help(),
          2 => _skins(),
          _ => _sound(),
        },
      ),
      const SizedBox(height: 12),
      Wrap(
        alignment: WrapAlignment.center,
        spacing: 10,
        runSpacing: 8,
        children: [
          _InkButton(
            label: 'Lanjut',
            icon: Icons.play_arrow_rounded,
            primary: true,
            onTap: () => game.action('resume'),
          ),
          if (widget.onExit != null)
            button('Menu utama', () {
              widget.onExit!();
            }),
          button(confirm ? 'Yakin? Ketuk lagi' : 'Mulai dari awal', () {
            if (confirm) {
              game.input.restart = true;
              setState(() => confirm = false);
            } else {
              setState(() => confirm = true);
            }
          }, danger: confirm),
        ],
      ),
    ],
  );

  Widget _map() => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Flexible(
        child: AspectRatio(
          aspectRatio: 1.4,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xff6b4528), width: 2.5),
              boxShadow: const [
                BoxShadow(color: Color(0x44000000), blurRadius: 8),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: CustomPaint(
              painter: WorldMapPainter(
                game.worldData,
                h['map'] as Map?,
                h['area'] as int,
              ),
            ),
          ),
        ),
      ),
      const SizedBox(height: 8),
      const Wrap(
        alignment: WrapAlignment.center,
        spacing: 10,
        runSpacing: 4,
        children: [
          _Legend(color: Colors.white, label: 'Aera'),
          _Legend(color: Color(0xffffd84a), label: 'Altar'),
          _Legend(color: Sky.sky, label: 'Sarang'),
          _Legend(color: leaf, label: 'Segel'),
        ],
      ),
      const SizedBox(height: 10),
      Text('PILIH LAPISAN', style: Sky.eyebrow(Sky.inkSoft)),
      const SizedBox(height: 6),
      Flexible(
        child: SingleChildScrollView(
          child: Wrap(
            alignment: WrapAlignment.center,
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final (index, name) in (h['areas'] as List).indexed)
                _areaButton(index, name as String),
            ],
          ),
        ),
      ),
    ],
  );

  Widget _areaButton(int index, String name) {
    final current = index == h['area'];
    final locked = h['cheat'] != true && index > ((h['maxArea'] as num?) ?? 0);
    return GestureDetector(
      onTap: () => game.action('warp', {'area': index}),
      child: Opacity(
        opacity: locked ? .45 : 1,
        child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: current
                ? const [Color(0xffb6ef7a), Color(0xff6cb73c)]
                : const [Color(0xfff2e2b4), Color(0xffdcc590)],
          ),
          border: Border.all(
            color: current ? Sky.leafDeep : const Color(0x552a170b),
            width: 1.5,
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          locked ? '🔒 ${index + 1}. $name' : '${index + 1}. $name',
          style: const TextStyle(
            fontFamily: Sky.display,
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: Sky.ink,
          ),
        ),
        ),
      ),
    );
  }

  Widget _help() => SingleChildScrollView(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('TUJUANMU SEKARANG', style: Sky.eyebrow(Sky.inkSoft)),
        const SizedBox(height: 6),
        Text(
          (h['hints'] as List)[0] as String,
          style: const TextStyle(
            fontFamily: Sky.display,
            color: Sky.ink,
            fontSize: 18,
            height: 1.3,
            fontWeight: FontWeight.w800,
          ),
        ),
        if ((h['hintTier'] as int) > 0) ...[
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0x14000000),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0x222a170b)),
            ),
            child: Text(
              (h['hints'] as List)[math.min(h['hintTier'] as int, 2)] as String,
              style: const TextStyle(
                fontFamily: Sky.display,
                color: Sky.ink,
                height: 1.4,
              ),
            ),
          ),
        ],
        const SizedBox(height: 12),
        if ((h['hintTier'] as int) < 2)
          _InkButton(
            label: 'Petunjuk berikutnya',
            icon: Icons.lightbulb_outline_rounded,
            onTap: () => game.action('hint'),
          ),
        const LeafDivider(),
        Text('KONTROL', style: Sky.eyebrow(Sky.inkSoft)),
        const SizedBox(height: 6),
        const Text(
          'A/D atau ←/→: bergerak\nW/S atau ↑/↓: panjat / berenang\nSpasi: lompat · Shift / L: dash\nE / Enter: interaksi · Q / Tab: ganti panah\nKlik tahan / J / K: bidik · Lepas: tembak\nEsc / P: jeda\n\nSentuh: joystick kiri untuk bergerak. Tahan busur, geser arah bidikan, lalu lepas.',
          style: TextStyle(
            fontFamily: Sky.display,
            color: Sky.ink,
            height: 1.55,
            fontSize: 13.5,
          ),
        ),
      ],
    ),
  );

  Widget _skins() => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(
          h['cheat'] == true ? '🪙 Koin: ∞' : '🪙 Koin: ${h['coins'] ?? 0}',
          style: const TextStyle(
            fontFamily: Sky.display,
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: Sky.ink,
          ),
        ),
      ),
      Flexible(child: _skinGrid()),
    ],
  );

  Widget _skinGrid() => GridView.builder(
    shrinkWrap: true,
    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
      maxCrossAxisExtent: 120,
      mainAxisExtent: 128,
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
    ),
    itemCount: (h['skins'] as List).length,
    itemBuilder: (context, index) {
      final skin = (h['skins'] as List)[index] as Map;
      final chosen = h['skin'] == skin['id'];
      final owned =
          h['cheat'] == true || (h['owned'] as Map?)?[skin['id']] == true;
      return GestureDetector(
        onTap: () => game.action('skin', {'id': skin['id']}),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: chosen
                  ? const [Color(0xffd8f7b2), Color(0xff9ddb66)]
                  : const [Color(0xfff2e2b4), Color(0xffd9c08a)],
            ),
            border: Border.all(
              color: chosen ? Sky.leafDeep : const Color(0x442a170b),
              width: chosen ? 3 : 1.5,
            ),
            borderRadius: BorderRadius.circular(14),
            boxShadow: chosen
                ? [
                    BoxShadow(
                      color: leaf.withValues(alpha: .45),
                      blurRadius: 14,
                    ),
                  ]
                : null,
          ),
          child: Column(
            children: [
              Expanded(
                child: Opacity(
                  opacity: owned ? 1 : .4,
                  child: SkinPreview(
                    key: ValueKey(skin['id']),
                    entry: game.catalog['${skin['prefix']}_BASIC'] as Map,
                  ),
                ),
              ),
              Text(
                owned ? skin['name'] as String : '🔒 🪙${skin['price']}',
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: Sky.display,
                  fontSize: 12,
                  fontWeight: chosen ? FontWeight.w800 : FontWeight.w600,
                  color: Sky.ink,
                ),
              ),
              const SizedBox(height: 5),
            ],
          ),
        ),
      );
    },
  );

  Widget _sound() {
    final settings = h['settings'] as Map;
    void update(String key, dynamic value) => game.action(
      'settings',
      Map<String, dynamic>.from(settings)..[key] = value,
    );
    return SingleChildScrollView(
      child: Column(
        children: [
          for (final (key, icon) in [
            ('music', Icons.music_note_rounded),
            ('sfx', Icons.graphic_eq_rounded),
          ])
            Row(
              children: [
                Icon(icon, size: 18, color: Sky.inkSoft),
                const SizedBox(width: 8),
                SizedBox(
                  width: 52,
                  child: Text(
                    key == 'music' ? 'Musik' : 'Efek',
                    style: const TextStyle(
                      fontFamily: Sky.display,
                      color: Sky.ink,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Expanded(
                  child: SliderTheme(
                    data: SliderThemeData(
                      activeTrackColor: Sky.leafDeep,
                      inactiveTrackColor: const Color(0x332a170b),
                      thumbColor: leaf,
                      overlayColor: leaf.withValues(alpha: .18),
                      trackHeight: 5,
                    ),
                    child: Slider(
                      value: (settings[key] as num).toDouble(),
                      divisions: 20,
                      onChanged: (v) => update(key, v),
                    ),
                  ),
                ),
                SizedBox(
                  width: 38,
                  child: Text(
                    '${((settings[key] as num) * 100).round()}%',
                    textAlign: TextAlign.right,
                    style: const TextStyle(
                      fontFamily: Sky.display,
                      color: Sky.inkSoft,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text(
              'Bisukan',
              style: TextStyle(
                fontFamily: Sky.display,
                color: Sky.ink,
                fontWeight: FontWeight.w700,
              ),
            ),
            secondary: const Icon(Icons.volume_off_rounded, color: Sky.inkSoft),
            activeThumbColor: leaf,
            activeTrackColor: Sky.leafDeep,
            value: settings['mute'] == true,
            onChanged: (v) => update('mute', v),
          ),
        ],
      ),
    );
  }

  Widget _travel() => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      const Icon(Icons.travel_explore_rounded, color: Sky.leafDeep, size: 30),
      const SizedBox(height: 8),
      const Text(
        'Terbang ke sarang',
        style: TextStyle(
          fontFamily: Sky.display,
          color: Sky.ink,
          fontSize: 24,
          fontWeight: FontWeight.w800,
        ),
      ),
      const LeafDivider(),
      Flexible(
        child: SingleChildScrollView(
          child: Column(
            children: [
              if ((h['travel'] as List).isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    'Aktifkan sarang lain untuk bisa terbang ke sana.',
                    textAlign: TextAlign.center,
                    style: Sky.body(Sky.inkSoft, 14),
                  ),
                ),
              for (final nest in h['travel'] as List)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _InkButton(
                    label: nest['name'] as String,
                    icon: Icons.home_rounded,
                    expand: true,
                    onTap: () => game.action('travel', {'id': nest['id']}),
                  ),
                ),
            ],
          ),
        ),
      ),
      const SizedBox(height: 12),
      button('Batal', () => game.action('closeMenu')),
    ],
  );

  Widget _ending() {
    final seconds = (h['time'] as num).floor();
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.auto_awesome_rounded,
            color: Color(0xffd9a300),
            size: 34,
          ),
          const SizedBox(height: 8),
          const Text(
            'Tiga Langit Terbuka',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: Sky.display,
              color: Sky.ink,
              fontSize: 27,
              fontWeight: FontWeight.w800,
            ),
          ),
          const LeafDivider(),
          const Text(
            'Jantung Pohon berdetak lagi. Akar bercahaya menyambungkan tiga belas lapisan, dari Lembah Akar Embun hingga Mahkota Bintang — dan dunia tetap terbuka untuk rahasia yang tertinggal.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: Sky.display,
              color: Sky.ink,
              fontSize: 16,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 8,
            runSpacing: 6,
            children: [
              _Pill(
                icon: Icons.schedule_rounded,
                text:
                    '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}',
              ),
              _Pill(
                icon: Icons.eco_rounded,
                text: '${h['seeds']}/${h['seedTotal']}',
              ),
              _Pill(
                icon: Icons.filter_drama_rounded,
                text: '${h['feathers']}/${h['featherTotal']}',
              ),
            ],
          ),
          const SizedBox(height: 16),
          _InkButton(
            label: 'Terus menjelajah',
            icon: Icons.explore_rounded,
            primary: true,
            onTap: () => game.action('afterEnding'),
          ),
        ],
      ),
    );
  }
}

/// Button sitting on parchment: ink text on a carved cap.
class _InkButton extends StatefulWidget {
  const _InkButton({
    required this.label,
    required this.onTap,
    this.icon,
    this.primary = false,
    this.danger = false,
    this.expand = false,
  });
  final String label;
  final IconData? icon;
  final VoidCallback onTap;
  final bool primary, danger, expand;
  @override
  State<_InkButton> createState() => _InkButtonState();
}

class _InkButtonState extends State<_InkButton> {
  bool down = false;
  @override
  Widget build(BuildContext context) {
    final colors = widget.danger
        ? const [Color(0xfff0a186), Color(0xffbb5137)]
        : widget.primary
        ? const [Color(0xffb6ef7a), Color(0xff6cb73c)]
        : const [Color(0xfff2e2b4), Color(0xffd9c08a)];
    return Semantics(
      label: widget.label,
      button: true,
      child: GestureDetector(
        onTapDown: (_) => setState(() => down = true),
        onTapUp: (_) => setState(() => down = false),
        onTapCancel: () => setState(() => down = false),
        onTap: widget.onTap,
        child: AnimatedScale(
          duration: const Duration(milliseconds: 80),
          scale: down ? .96 : 1,
          child: Container(
            width: widget.expand ? double.infinity : null,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: colors,
              ),
              border: Border.all(color: const Color(0x772a170b), width: 1.6),
              borderRadius: BorderRadius.circular(12),
              boxShadow: down
                  ? null
                  : const [
                      BoxShadow(color: Color(0x33000000), offset: Offset(0, 2)),
                    ],
            ),
            child: Row(
              mainAxisSize: widget.expand ? MainAxisSize.max : MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (widget.icon != null) ...[
                  Icon(widget.icon, size: 17, color: Sky.ink),
                  const SizedBox(width: 7),
                ],
                Flexible(
                  child: Text(
                    widget.label,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: Sky.display,
                      color: Sky.ink,
                      fontWeight: FontWeight.w800,
                      fontSize: 14.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
    decoration: BoxDecoration(
      color: const Color(0x182a170b),
      borderRadius: Sky.pillRadius,
      border: Border.all(color: const Color(0x332a170b)),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: Sky.inkSoft),
        const SizedBox(width: 5),
        Text(
          text,
          style: const TextStyle(
            fontFamily: Sky.display,
            color: Sky.ink,
            fontSize: 12.5,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    ),
  );
}

class _Legend extends StatelessWidget {
  const _Legend({required this.color, required this.label});
  final Color color;
  final String label;
  @override
  Widget build(BuildContext context) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Container(
        width: 9,
        height: 9,
        decoration: BoxDecoration(shape: BoxShape.circle, color: color),
      ),
      const SizedBox(width: 5),
      Text(
        label,
        style: const TextStyle(
          fontFamily: Sky.display,
          color: Sky.inkSoft,
          fontSize: 12,
        ),
      ),
    ],
  );
}

class SkinPreview extends StatefulWidget {
  const SkinPreview({super.key, required this.entry});
  final Map entry;
  @override
  State<SkinPreview> createState() => _SkinPreviewState();
}

class _SkinPreviewState extends State<SkinPreview> {
  ui.Image? image;
  @override
  void initState() {
    super.initState();
    unawaited(_load());
  }

  Future<void> _load() async {
    final data = await rootBundle.load('assets/images/${widget.entry['file']}');
    final codec = await ui.instantiateImageCodec(
      data.buffer.asUint8List(data.offsetInBytes, data.lengthInBytes),
      targetWidth: 384,
    );
    final decoded = (await codec.getNextFrame()).image;
    codec.dispose();
    if (!mounted) {
      decoded.dispose();
      return;
    }
    setState(() => image = decoded);
  }

  @override
  void dispose() {
    image?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => image == null
      ? const SizedBox.shrink()
      : CustomPaint(
          painter: _SkinPainter(image!, widget.entry),
          size: const Size(80, 95),
        );
}

class _SkinPainter extends CustomPainter {
  _SkinPainter(this.image, this.entry);
  final ui.Image image;
  final Map entry;
  @override
  void paint(Canvas canvas, Size size) {
    final logicalW = (entry['width'] as num).toDouble(),
        logicalH = (entry['height'] as num).toDouble();
    final source = Rect.fromLTWH(0, 0, image.width / 5, image.height / 4);
    final ratio = math.min(
      size.width / (logicalW / 5),
      size.height / (logicalH / 4),
    );
    final width = logicalW / 5 * ratio, height = logicalH / 4 * ratio;
    canvas.drawImageRect(
      image,
      source,
      Rect.fromLTWH(
        (size.width - width) / 2,
        size.height - height,
        width,
        height,
      ),
      Paint()..filterQuality = FilterQuality.medium,
    );
  }

  @override
  bool shouldRepaint(_SkinPainter old) => image != old.image;
}

class WorldMapPainter extends CustomPainter {
  WorldMapPainter(this.world, this.state, this.area);
  final Map world;
  final Map? state;
  final int area;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
      Offset.zero & size,
      Paint()..color = const Color(0xff17120c),
    );
    if (state == null || world.isEmpty) return;
    final top = (12 - math.min(12, area + 1)) * 36,
        bottom = (13 - math.max(0, area - 1)) * 36;
    final cell = math.min(size.width / 48, size.height / (bottom - top));
    canvas.save();
    canvas.translate(
      (size.width - 48 * cell) / 2,
      (size.height - (bottom - top) * cell) / 2,
    );
    canvas.drawRect(
      Rect.fromLTWH(0, 0, 48 * cell, (bottom - top) * cell),
      Paint()..color = const Color(0xff1d140c),
    );
    final explored = state!['explored'] as String,
        tiles = world['tiles'] as List;
    for (var y = top; y < bottom; y++) {
      for (var x = 0; x < 48; x++) {
        final index = (y ~/ 4) * 12 + x ~/ 4;
        if (index >= explored.length || explored[index] != '1') continue;
        final tile = tiles[(y * 48 + x).toInt()];
        canvas.drawRect(
          Rect.fromLTWH(x * cell, (y - top) * cell, cell + .3, cell + .3),
          Paint()
            ..color = tile == 2
                ? const Color(0xff6fae2f)
                : tile == 1
                ? const Color(0xff7a5634)
                : const Color(0xff3b5a52),
        );
      }
    }
    for (final d in world['defs'] as List) {
      final x = (d['x'] as num).toDouble(),
          y = (d['y'] as num).toDouble(),
          row = y / 32;
      final index = (row ~/ 4) * 12 + ((x / 32) ~/ 4);
      if (row < top ||
          row >= bottom ||
          index >= explored.length ||
          explored[index] != '1') {
        continue;
      }
      final active =
          (state![d['type'] == 'checkpoint'
                  ? 'cps'
                  : d['type'] == 'nest'
                  ? 'nests'
                  : 'gates']
              as Map)[d['id']] ==
          true;
      final color = !active
          ? const Color(0xff8a7a5a)
          : d['type'] == 'checkpoint'
          ? const Color(0xffffd84a)
          : d['type'] == 'nest'
          ? Sky.sky
          : leaf;
      final at = Offset(x / 32 * cell, (row - top) * cell);
      if (active) {
        canvas.drawCircle(
          at,
          5.5,
          Paint()
            ..color = color.withValues(alpha: .35)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
        );
      }
      canvas.drawCircle(at, 2.8, Paint()..color = color);
    }
    final p = state!['player'] as Map;
    final me = Offset(
      (p['x'] as num) / 32 * cell,
      ((p['y'] as num) / 32 - top) * cell,
    );
    canvas.drawCircle(
      me,
      7,
      Paint()
        ..color = Colors.white.withValues(alpha: .35)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
    );
    canvas.drawCircle(me, 3.5, Paint()..color = Colors.white);
    canvas.restore();
  }

  @override
  bool shouldRepaint(WorldMapPainter old) =>
      old.state != state || old.area != area;
}
