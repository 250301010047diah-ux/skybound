import 'dart:async';
import 'package:flutter/services.dart';
import 'package:audioplayers/audioplayers.dart';

// Effects must not take audio focus. On Android every player requests
// AUDIOFOCUS_GAIN by default, so a short effect would pause the looping music.
final _mixContext = AudioContext(
  android: const AudioContextAndroid(
    audioFocus: AndroidAudioFocus.none,
    contentType: AndroidContentType.music,
    usageType: AndroidUsageType.media,
  ),
  iOS: AudioContextIOS(
    category: AVAudioSessionCategory.playback,
    options: const {AVAudioSessionOptions.mixWithOthers},
  ),
);

// One shared player for menu, area and boss music.
final GameAudio gameAudio = GameAudio();

class GameAudio {
  final AudioPlayer _music = AudioPlayer();
  final Set<AudioPlayer> _effects = {};
  static const tracks = [
    'bgm',
    'bgm_explore',
    'bgm_mystery',
    'bgm_sky',
    'bgm_boss',
  ];
  final Map<String, Future<bool>> _available = {};
  Future<bool> _hasAudio(String name) => _available.putIfAbsent(name, () async {
    try {
      return (await rootBundle.load('assets/audio/$name.mp3')).lengthInBytes >
          0;
    } catch (_) {
      return false;
    }
  });
  Future<void> playEffect(String name, {double volume = 0.7}) async {
    if (volume <= 0 || !await _hasAudio(name)) return;
    // Never reuse a voice that is still playing: overlapping effects must finish.
    // Bound pathological bursts without interrupting any existing sound.
    if (_effects.length >= 32) return;
    final player = AudioPlayer();
    _effects.add(player);
    StreamSubscription<void>? completion;
    var released = false;
    Future<void> release() async {
      if (released) return;
      released = true;
      _effects.remove(player);
      await completion?.cancel();
      try {
        await player.dispose();
      } catch (_) {
        // Platform cleanup must not interrupt the game.
      }
    }

    completion = player.onPlayerComplete.listen((_) => unawaited(release()));
    try {
      // Await configuration before playback; setting it in the constructor
      // without awaiting can let the first effect request default audio focus.
      await player.setAudioContext(_mixContext);
      await player.setReleaseMode(ReleaseMode.release);
      await player.play(
        AssetSource('audio/$name.mp3'),
        volume: volume.clamp(0.0, 1.0),
      );
    } catch (_) {
      await release();
    }
  }

  int _loadedTrack = -1;
  bool _busy = false;
  DateTime _retryAfter = DateTime.fromMillisecondsSinceEpoch(0);
  // What the game asks for, and what the music player last confirmed.
  int _track = -1, _appliedTrack = -2;
  bool _paused = true, _appliedPaused = true;
  double _volume = 0, _appliedVolume = -1;

  static const _menuTrack = 0;

  // Main menu theme; gameplay selects its own track.
  void playMenu({required double volume}) {
    _setMusic(track: _menuTrack, paused: false, volume: volume);
  }

  void sync(Map<String, dynamic> frame, Map<String, dynamic> tweaks) {
    final settings = (frame['hud'] as Map)['settings'] as Map;
    final muted = settings['mute'] == true || tweaks['muted']?['value'] == true;
    final volume = muted
        ? 0.0
        : (settings['music'] as num).toDouble() *
              ((tweaks['musicVolume']?['value'] as num?)?.toDouble() ?? 0.5);
    final sfxVolume = muted
        ? 0.0
        : (settings['sfx'] as num).toDouble() *
              ((tweaks['sfxVolume']?['value'] as num?)?.toDouble() ?? 0.7);
    final track = frame['track'] as int? ?? -1;
    final paused = frame['audioPaused'] == true || track < 0;
    // While an area is still loading, the current theme keeps playing.
    if (track >= 0) {
      _setMusic(track: track, paused: paused, volume: volume);
    }
    if (sfxVolume > 0) {
      for (final sound in (frame['sounds'] as List).toSet()) {
        if (!paused || sound == 'click') {
          unawaited(playEffect(sound as String, volume: sfxVolume));
        }
      }
    }
  }

  void _setMusic({
    required int track,
    required bool paused,
    required double volume,
  }) {
    _track = track;
    _paused = paused;
    _volume = volume;
    _syncMusic();
  }

  bool get _musicChanged =>
      _track != _appliedTrack ||
      _paused != _appliedPaused ||
      _volume != _appliedVolume;

  // Only one change runs at a time. A failed change is retried on a later call
  // (the game sends a frame every tick), never in a tight loop.
  void _syncMusic() {
    if (_busy || !_musicChanged || DateTime.now().isBefore(_retryAfter)) {
      return;
    }
    unawaited(_applyMusic());
  }

  Future<void> _applyMusic() async {
    _busy = true;
    final track = _track, paused = _paused, volume = _volume;
    try {
      await _music.setVolume(volume.clamp(0.0, 1.0));
      if (paused) {
        await _music.pause();
      } else if (_loadedTrack != track) {
        await _music.setAudioContext(_mixContext);
        await _music.setReleaseMode(ReleaseMode.loop);
        await _music.stop();
        if (track >= 0 &&
            track < tracks.length &&
            await _hasAudio(tracks[track])) {
          await _music.play(
            AssetSource('audio/${tracks[track]}.mp3'),
            volume: volume.clamp(0.0, 1.0),
          );
        }
        _loadedTrack = track;
      } else if (track >= 0 &&
          track < tracks.length &&
          await _hasAudio(tracks[track])) {
        await _music.resume();
      }
      _appliedTrack = track;
      _appliedPaused = paused;
      _appliedVolume = volume;
    } catch (_) {
      // Audio must not interrupt simulation; the next call tries again.
      _retryAfter = DateTime.now().add(const Duration(seconds: 1));
    } finally {
      _busy = false;
    }
    _syncMusic();
  }

  void pause() {
    // Serialize lifecycle pauses with track changes so an old pause cannot
    // finish after the menu has already requested music again.
    _paused = true;
    _syncMusic();
  }
}
