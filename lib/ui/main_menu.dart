import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../game/game_audio.dart';
import 'game_screen.dart';
import 'theme.dart';
import 'tutorial.dart';

// Same as the default musicVolume in tweaks.json.
const _menuMusicVolume = 0.3;

class MainMenu extends StatefulWidget {
  const MainMenu({super.key});
  @override
  State<MainMenu> createState() => _MainMenuState();
}

class _MainMenuState extends State<MainMenu>
    with TickerProviderStateMixin, WidgetsBindingObserver {
  // The logo breathes; the rest of the menu arrives once, on open.
  late final AnimationController _float = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 6),
  )..repeat(reverse: true);
  late final AnimationController _enter = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 700),
  );
  bool playing = false, loaded = false, showGuide = false, cheat = false;
  Map<String, dynamic>? saved;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    Map<String, dynamic>? data;
    try {
      final raw = prefs.getString('skybound.save.v1');
      if (raw != null) data = jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      data = null;
    }
    if (!mounted || playing) return;
    saved = data;
    cheat = prefs.getBool('skybound.cheat') ?? false;
    _playMenuMusic();
    _enter.forward(from: 0);
    setState(() => loaded = true);
  }

  Future<void> _toggleCheat() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('skybound.cheat', !cheat);
    if (!mounted) return;
    setState(() => cheat = !cheat);
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(
      SnackBar(
        content: Text(
          cheat
              ? 'Koin tak terbatas! Semua jubah & area terbuka.'
              : 'Cheat dimatikan. Jubah & area kembali mengikuti progres.',
        ),
      ),
    );
  }

  void _playMenuMusic() {
    if (playing || !mounted) return;
    final settings = (saved?['pr'] as Map?)?['settings'] as Map?;
    final muted = settings?['mute'] == true;
    final music = (settings?['music'] as num?)?.toDouble() ?? 1;
    gameAudio.playMenu(volume: muted ? 0 : music * _menuMusicVolume);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (playing) return; // GameScreen manages gameplay lifecycle.
    if (state == AppLifecycleState.resumed) {
      _playMenuMusic();
    } else {
      gameAudio.pause();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _float.dispose();
    _enter.dispose();
    super.dispose();
  }

  Future<void> _reset() async {
    final agreed = await showDialog<bool>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: .66),
      builder: (context) => AlertDialog(
        backgroundColor: Sky.parchment,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: const BorderSide(color: Color(0xff8a5a33), width: 2.5),
        ),
        titlePadding: const EdgeInsets.fromLTRB(24, 22, 24, 8),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Color(0xffa83e29)),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Reset progres?',
                style: TextStyle(
                  color: Sky.ink,
                  fontWeight: FontWeight.w800,
                  fontSize: 21,
                ),
              ),
            ),
          ],
        ),
        content: const Text(
          'Checkpoint, kemampuan, koleksi, dan progres area akan dihapus. Petualangan berikutnya dimulai dari awal.',
          style: TextStyle(color: Sky.ink, height: 1.45),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text(
              'Batal',
              style: TextStyle(color: Sky.ink, fontWeight: FontWeight.w700),
            ),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xffa83e29),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Reset progres',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
    if (agreed != true) return;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('skybound.save.v1');
    if (mounted) setState(() => saved = null);
  }

  /// Fade-and-rise for one block of the menu, staggered by [order].
  Widget _enters(int order, Widget child) {
    final curve = CurvedAnimation(
      parent: _enter,
      curve: Interval(
        (order * .12).clamp(0, .6),
        ((order * .12) + .5).clamp(.1, 1),
        curve: Curves.easeOutCubic,
      ),
    );
    return AnimatedBuilder(
      animation: curve,
      builder: (context, inner) => Opacity(
        opacity: curve.value,
        child: Transform.translate(
          offset: Offset(0, 18 * (1 - curve.value)),
          child: inner,
        ),
      ),
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (playing) {
      return GameScreen(
        onExit: () async {
          setState(() => playing = false);
          await _load();
        },
      );
    }
    final pr = saved?['pr'] as Map?;
    return Scaffold(
      body: Listener(
        onPointerDown: (_) {
          if (loaded) _playMenuMusic();
        },
        child: SkyBackdrop(
          image: 'assets/images/bg_a1.webp',
          child: Stack(
            children: [
              SafeArea(
                minimum: const EdgeInsets.all(18),
                child: LayoutBuilder(
                  builder: (context, box) {
                    final wide =
                        box.maxWidth > 700 && box.maxWidth > box.maxHeight;
                    final logoSize = wide
                        ? math.min(box.maxHeight * .58, 280.0)
                        : math.min(box.maxWidth * .62, 250.0);
                    final logo = Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        AnimatedBuilder(
                          animation: _float,
                          builder: (context, child) => Transform.translate(
                            offset: Offset(
                              0,
                              math.sin(_float.value * math.pi * 2) * 5,
                            ),
                            child: child,
                          ),
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(60),
                              boxShadow: [
                                BoxShadow(
                                  color: Sky.leaf.withValues(alpha: .34),
                                  blurRadius: 72,
                                  spreadRadius: 6,
                                ),
                                BoxShadow(
                                  color: Sky.amber.withValues(alpha: .16),
                                  blurRadius: 120,
                                  spreadRadius: 18,
                                ),
                              ],
                            ),
                            child: Image.asset(
                              'assets/images/logo.png',
                              width: logoSize,
                              filterQuality: FilterQuality.high,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const _Wordmark(),
                      ],
                    );
                    final actions = ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 380),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _enters(0, const _Tagline()),
                          const SizedBox(height: 22),
                          _enters(
                            1,
                            SkyButton(
                              label: saved == null
                                  ? 'Mulai petualangan'
                                  : 'Lanjutkan petualangan',
                              icon: Icons.play_arrow_rounded,
                              kind: SkyButtonKind.primary,
                              height: 58,
                              fontSize: 18,
                              onTap: loaded
                                  ? () => setState(() => playing = true)
                                  : null,
                            ),
                          ),
                          const SizedBox(height: 11),
                          _enters(
                            2,
                            SkyButton(
                              label: cheat
                                  ? 'Unlimited koin: AKTIF'
                                  : 'Unlimited koin & buka semua',
                              icon: cheat
                                  ? Icons.lock_open_rounded
                                  : Icons.monetization_on_rounded,
                              kind: cheat
                                  ? SkyButtonKind.primary
                                  : SkyButtonKind.ghost,
                              onTap: loaded ? _toggleCheat : null,
                            ),
                          ),
                          const SizedBox(height: 11),
                          _enters(
                            2,
                            SkyButton(
                              label: 'Cara bermain',
                              icon: Icons.menu_book_rounded,
                              onTap: () => setState(() => showGuide = true),
                            ),
                          ),
                          if (saved != null) ...[
                            const SizedBox(height: 11),
                            _enters(
                              3,
                              SkyButton(
                                label: 'Reset progres',
                                icon: Icons.restart_alt_rounded,
                                kind: SkyButtonKind.ghost,
                                onTap: _reset,
                              ),
                            ),
                          ],
                          const SizedBox(height: 16),
                          _enters(4, _SaveStrip(pr: pr)),
                        ],
                      ),
                    );
                    return Center(
                      child: SingleChildScrollView(
                        key: const ValueKey('main-menu-scroll'),
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: wide
                            ? Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Flexible(child: logo),
                                  const SizedBox(width: 56),
                                  Flexible(child: actions),
                                ],
                              )
                            : Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  logo,
                                  const SizedBox(height: 28),
                                  actions,
                                ],
                              ),
                      ),
                    );
                  },
                ),
              ),
              if (showGuide)
                Positioned.fill(
                  child: TutorialOverlay(
                    onDone: () => setState(() => showGuide = false),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The subtitle under the logo, set as a rule-flanked eyebrow.
class _Wordmark extends StatelessWidget {
  const _Wordmark();
  @override
  Widget build(BuildContext context) => FittedBox(
    fit: BoxFit.scaleDown,
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 26,
          height: 1.4,
          color: Sky.leaf.withValues(alpha: .5),
        ),
        const SizedBox(width: 12),
        Text('DARI AKAR MENUJU BINTANG', style: Sky.eyebrow(Sky.amber)),
        const SizedBox(width: 12),
        Container(
          width: 26,
          height: 1.4,
          color: Sky.leaf.withValues(alpha: .5),
        ),
      ],
    ),
  );
}

class _Tagline extends StatelessWidget {
  const _Tagline();
  @override
  Widget build(BuildContext context) => Column(
    children: [
      ShaderMask(
        shaderCallback: (rect) => const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.white, Sky.amber],
        ).createShader(rect),
        child: Text(
          'Langit menunggumu.',
          textAlign: TextAlign.center,
          style: Sky.title(31),
        ),
      ),
      const SizedBox(height: 8),
      Text(
        'Jelajahi 13 lapisan Pohon Langit,\nbangunkan akar, dan temukan rahasianya.',
        textAlign: TextAlign.center,
        style: Sky.body(Sky.textSoft, 14.5),
      ),
    ],
  );
}

/// What the save holds, so continuing is an informed choice rather than a leap.
class _SaveStrip extends StatelessWidget {
  const _SaveStrip({required this.pr});
  final Map? pr;
  @override
  Widget build(BuildContext context) {
    final seconds = (pr?['time'] as num?)?.floor() ?? 0;
    final clock =
        '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      radius: 14,
      opacity: .5,
      blur: 8,
      child: pr == null
          ? Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.save_outlined, color: Sky.textSoft, size: 16),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    'Progres disimpan otomatis di perangkat',
                    textAlign: TextAlign.center,
                    style: Sky.body(Sky.textSoft, 12),
                  ),
                ),
              ],
            )
          : Row(
              children: [
                _Stat(
                  icon: Icons.eco_rounded,
                  color: Sky.leaf,
                  value: '${pr!['seeds'] ?? 0}',
                  label: 'Benih',
                ),
                _Divider(),
                _Stat(
                  icon: Icons.filter_drama_rounded,
                  color: Sky.sky,
                  value: '${pr!['feathers'] ?? 0}',
                  label: 'Bulu',
                ),
                _Divider(),
                _Stat(
                  icon: Icons.schedule_rounded,
                  color: Sky.amber,
                  value: clock,
                  label: 'Waktu',
                ),
              ],
            ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    width: 1,
    height: 26,
    color: Colors.white.withValues(alpha: .14),
  );
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
  });
  final IconData icon;
  final Color color;
  final String value, label;
  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 5),
            Text(
              value,
              style: TextStyle(
                fontFamily: Sky.display,
                fontWeight: FontWeight.w800,
                fontSize: 15,
                color: Sky.text,
              ),
            ),
          ],
        ),
        Text(label, style: Sky.eyebrow(Sky.textSoft).copyWith(fontSize: 9)),
      ],
    ),
  );
}
