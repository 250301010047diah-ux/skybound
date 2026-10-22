import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'theme.dart';

class TutorialOverlay extends StatefulWidget {
  const TutorialOverlay({super.key, required this.onDone});
  final VoidCallback onDone;
  @override
  State<TutorialOverlay> createState() => _TutorialOverlayState();
}

class _TutorialOverlayState extends State<TutorialOverlay> {
  int page = 0;
  // icon, accent, title, body, keyboard footnote
  static const steps = [
    (
      Icons.explore_rounded,
      Sky.leaf,
      'Selamat datang, Aera!',
      'Naiki 13 lapisan Pohon Langit. Jelajahi jalur, bicara dengan penduduk, dan pecahkan puzzle untuk membuka area berikutnya.',
      'Progres tersimpan otomatis. Kamu kembali dari checkpoint terakhir.',
    ),
    (
      Icons.open_with_rounded,
      Sky.sky,
      'Bergerak & melompat',
      'Geser joystick kiri untuk bergerak. Geser atas atau bawah untuk memanjat sulur dan berenang. Tombol ↑ untuk lompat, tombol dash untuk melesat.',
      'Keyboard: A/D atau ←/→ · Spasi lompat · Shift dash',
    ),
    (
      Icons.north_east_rounded,
      Sky.amber,
      'Bidik. Tarik. Lepaskan.',
      'Tahan tombol busur hijau, geser ke arah sasaran, lalu lepas untuk menembak. Garis lengkung menunjukkan jalur panah. Ketuk slot panah di atas untuk berganti kemampuan.',
      'Keyboard: tahan klik atau J/K · Q ganti panah',
    ),
    (
      Icons.eco_rounded,
      Sky.ember,
      'Temukan jalanmu',
      'Ketuk tombol tangan di dekat NPC, altar, atau objek puzzle. Aktifkan altar untuk menyimpan checkpoint. Buka peta dan petunjuk dari menu jeda.',
      'Tombol ? membuka tutorial ini lagi. Tombol speaker mengatur suara.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final step = steps[page];
    final last = page == steps.length - 1;
    return SkyBackdrop(
      motes: 14,
      tint: const [Color(0xcc09150f), Color(0xe00c1b13), Color(0xf5060f0b)],
      child: SafeArea(
        minimum: const EdgeInsets.all(16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: SingleChildScrollView(
              child: GlassCard(
                padding: const EdgeInsets.fromLTRB(22, 18, 22, 20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Text(
                          'PANDUAN ${page + 1} / ${steps.length}',
                          style: Sky.eyebrow(step.$2),
                        ),
                        const Spacer(),
                        GestureDetector(
                          behavior: HitTestBehavior.opaque,
                          onTap: widget.onDone,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 6,
                            ),
                            child: Text(
                              'Lewati',
                              style: Sky.body(
                                Sky.textSoft,
                                13,
                              ).copyWith(fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // The whole body swaps as one card, so the steps read as a
                    // single panel changing rather than four separate screens.
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 260),
                      switchInCurve: Curves.easeOutCubic,
                      transitionBuilder: (child, anim) => FadeTransition(
                        opacity: anim,
                        child: SlideTransition(
                          position: Tween(
                            begin: const Offset(.06, 0),
                            end: Offset.zero,
                          ).animate(anim),
                          child: child,
                        ),
                      ),
                      child: Column(
                        key: ValueKey(page),
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _GlowIcon(icon: step.$1, color: step.$2),
                          const SizedBox(height: 16),
                          Text(
                            step.$3,
                            textAlign: TextAlign.center,
                            style: Sky.title(26),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            step.$4,
                            textAlign: TextAlign.center,
                            style: Sky.body(Sky.textSoft, 15),
                          ),
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 9,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: .26),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: .1),
                              ),
                            ),
                            child: Text(
                              step.$5,
                              textAlign: TextAlign.center,
                              style: Sky.body(
                                Sky.textSoft.withValues(alpha: .85),
                                12.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),
                    // Dots on their own line: at phone width a back link, the
                    // dots and the next button cannot share one row without
                    // squeezing the labels.
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        for (var i = 0; i < steps.length; i++)
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 220),
                            curve: Curves.easeOutCubic,
                            width: i == page ? 20 : 6,
                            height: 6,
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            decoration: BoxDecoration(
                              color: i == page
                                  ? step.$2
                                  : Colors.white.withValues(alpha: .22),
                              borderRadius: BorderRadius.circular(5),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        if (page > 0) ...[
                          Expanded(
                            flex: 2,
                            child: SkyButton(
                              label: 'Kembali',
                              icon: Icons.chevron_left_rounded,
                              kind: SkyButtonKind.ghost,
                              height: 46,
                              fontSize: 15,
                              onTap: () => setState(() => page--),
                            ),
                          ),
                          const SizedBox(width: 10),
                        ],
                        Expanded(
                          flex: 3,
                          child: SkyButton(
                            label: last ? 'Ayo main!' : 'Lanjut',
                            kind: SkyButtonKind.primary,
                            height: 46,
                            fontSize: 15,
                            onTap: last
                                ? widget.onDone
                                : () => setState(() => page++),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The step icon inside a soft ring of its own accent colour.
class _GlowIcon extends StatefulWidget {
  const _GlowIcon({required this.icon, required this.color});
  final IconData icon;
  final Color color;
  @override
  State<_GlowIcon> createState() => _GlowIconState();
}

class _GlowIconState extends State<_GlowIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 3),
  )..repeat();

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _pulse,
    builder: (context, child) {
      final wave = .5 + .5 * math.sin(_pulse.value * math.pi * 2);
      return Container(
        width: 92,
        height: 92,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              widget.color.withValues(alpha: .3),
              widget.color.withValues(alpha: .05),
            ],
          ),
          border: Border.all(
            color: widget.color.withValues(alpha: .4 + .3 * wave),
            width: 1.8,
          ),
          boxShadow: [
            BoxShadow(
              color: widget.color.withValues(alpha: .18 + .14 * wave),
              blurRadius: 28,
              spreadRadius: 2,
            ),
          ],
        ),
        child: child,
      );
    },
    child: Icon(widget.icon, size: 42, color: widget.color),
  );
}
