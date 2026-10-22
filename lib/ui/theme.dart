import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

/// The shared look of every screen outside the world itself: menu, tutorial,
/// HUD chrome, pause, travel and ending. The world keeps rendering through the
/// original canvas commands; everything framed around it is built from here so
/// one palette, one set of panels and one button carry the whole app.
class Sky {
  // Canopy night, from the deepest shade up to the lit understory.
  static const night = Color(0xff0a1710);
  static const forest = Color(0xff122a1d);
  static const moss = Color(0xff1d4330);

  // Parchment, for anything that reads as paper or carved wood.
  static const parchment = Color(0xfffff6dc);
  static const parchmentDeep = Color(0xffeed9a6);
  static const ink = Color(0xff2a170b);
  static const inkSoft = Color(0xff6b5a3e);

  // Accents: leaf for growth and confirmation, amber for treasure and warning,
  // sky for focus and travel, ember for danger.
  static const leaf = Color(0xff8fe060);
  static const leafDeep = Color(0xff3f7a1c);
  static const amber = Color(0xffffd98a);
  static const sky = Color(0xff8fd8ff);
  static const ember = Color(0xffff7954);

  static const text = Color(0xfff3f8e4);
  static const textSoft = Color(0xffbfd1ab);

  static const display = 'AeraDisplay';

  static TextStyle title(double size) => TextStyle(
    fontFamily: display,
    fontSize: size,
    height: 1.08,
    fontWeight: FontWeight.w800,
    color: text,
    letterSpacing: -0.2,
  );

  /// Small all-caps label above a block of content.
  static TextStyle eyebrow([Color color = textSoft]) => TextStyle(
    fontFamily: display,
    fontSize: 11,
    fontWeight: FontWeight.w800,
    letterSpacing: 2.6,
    color: color,
  );

  static TextStyle body([Color color = textSoft, double size = 14]) =>
      TextStyle(
        fontFamily: display,
        fontSize: size,
        height: 1.45,
        color: color,
      );

  static const radius = 20.0;
  static final cardRadius = BorderRadius.circular(radius);
  static final pillRadius = BorderRadius.circular(999);

  /// Depth: one tight contact shadow plus one wide ambient one. Two layers read
  /// as lift without the muddy halo a single large blur leaves.
  static List<BoxShadow> lift([double strength = 1]) => [
    BoxShadow(
      color: Colors.black.withValues(alpha: .34 * strength),
      blurRadius: 10 * strength,
      offset: Offset(0, 3 * strength),
    ),
    BoxShadow(
      color: Colors.black.withValues(alpha: .22 * strength),
      blurRadius: 30 * strength,
      offset: Offset(0, 14 * strength),
    ),
  ];
}

/// Living backdrop for the menu and the full-screen overlays: a deep canopy
/// gradient, drifting spores, and a vignette that pulls the eye to the middle.
class SkyBackdrop extends StatefulWidget {
  const SkyBackdrop({
    super.key,
    this.image,
    this.child,
    this.motes = 26,
    this.tint = const [Color(0x5510231a), Color(0x99102019), Color(0xf2060f0b)],
  });
  final String? image;
  final Widget? child;
  final int motes;
  final List<Color> tint;
  @override
  State<SkyBackdrop> createState() => _SkyBackdropState();
}

class _SkyBackdropState extends State<SkyBackdrop>
    with SingleTickerProviderStateMixin {
  late final AnimationController _drift = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 24),
  )..repeat();

  @override
  void dispose() {
    _drift.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Stack(
    fit: StackFit.expand,
    children: [
      const ColoredBox(color: Sky.night),
      if (widget.image != null)
        Image.asset(
          widget.image!,
          fit: BoxFit.cover,
          alignment: const Alignment(.15, 0),
        ),
      DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: widget.tint,
            stops: const [0, .46, 1],
          ),
        ),
      ),
      IgnorePointer(
        child: AnimatedBuilder(
          animation: _drift,
          builder: (context, _) =>
              CustomPaint(painter: _Motes(_drift.value, widget.motes)),
        ),
      ),
      const IgnorePointer(child: CustomPaint(painter: _Vignette())),
      if (widget.child != null) widget.child!,
    ],
  );
}

class _Motes extends CustomPainter {
  _Motes(this.time, this.count);
  final double time;
  final int count;
  @override
  void paint(Canvas canvas, Size size) {
    for (var i = 0; i < count; i++) {
      final seed = i * 97.13;
      final x =
          (seed * 1.7 + time * (30 + i % 7 * 14)) % (size.width + 60) - 30;
      final y =
          (seed * 2.3 - time * size.height * (.18 + (i % 5) * .05)) %
              (size.height + 60) -
          30;
      final pulse = .5 + .5 * math.sin(time * math.pi * 2 * (1 + i % 3) + i);
      final radius = 1.2 + (i % 4) * .7;
      canvas.drawCircle(
        Offset(x, y),
        radius * (.7 + pulse * .6),
        Paint()
          ..color = (i.isEven ? Sky.leaf : Sky.amber).withValues(
            alpha: .14 + .34 * pulse,
          )
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
      );
    }
  }

  @override
  bool shouldRepaint(_Motes old) => old.time != time;
}

class _Vignette extends CustomPainter {
  const _Vignette();
  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    canvas.drawRect(
      rect,
      Paint()
        ..shader = ui.Gradient.radial(
          rect.center,
          size.longestSide * .72,
          [Colors.transparent, Colors.black.withValues(alpha: .55)],
          [.45, 1],
        ),
    );
  }

  @override
  bool shouldRepaint(_Vignette old) => false;
}

/// Translucent panel over the world or the backdrop: blurred, with a lit top
/// edge so it sits on the scene instead of floating in front of it.
class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.radius = Sky.radius,
    this.tint = Sky.forest,
    this.opacity = .82,
    this.blur = 14,
  });
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius, opacity, blur;
  final Color tint;
  @override
  Widget build(BuildContext context) {
    final corners = BorderRadius.circular(radius);
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: corners,
        boxShadow: Sky.lift(1.2),
      ),
      child: ClipRRect(
        borderRadius: corners,
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              borderRadius: corners,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color.lerp(
                    tint,
                    Colors.white,
                    .1,
                  )!.withValues(alpha: opacity),
                  tint.withValues(alpha: opacity),
                  Color.lerp(
                    tint,
                    Colors.black,
                    .3,
                  )!.withValues(alpha: opacity),
                ],
              ),
              border: Border.all(
                color: Colors.white.withValues(alpha: .16),
                width: 1.2,
              ),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

/// Carved parchment: the in-world voice. Dialog, pause and ending sit on it so
/// the story keeps the storybook feel while the chrome around it stays glass.
class ParchmentPanel extends StatelessWidget {
  const ParchmentPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.radius = 22,
  });
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      borderRadius: BorderRadius.circular(radius + 4),
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xff8a5a33), Color(0xff4a2f18)],
      ),
      boxShadow: Sky.lift(1.3),
    ),
    padding: const EdgeInsets.all(3),
    child: Container(
      padding: padding,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Sky.parchment, Sky.parchmentDeep],
        ),
        border: Border.all(color: const Color(0x332a170b), width: 1.4),
      ),
      child: child,
    ),
  );
}

enum SkyButtonKind { primary, secondary, ghost, danger }

/// One button for the whole app. It presses in, keeps a lit top edge, and the
/// primary one carries a slow sheen so the main action is never ambiguous.
class SkyButton extends StatefulWidget {
  const SkyButton({
    super.key,
    required this.label,
    this.icon,
    this.onTap,
    this.kind = SkyButtonKind.secondary,
    this.height = 54,
    this.expand = true,
    this.fontSize = 17,
  });
  final String label;
  final IconData? icon;
  final VoidCallback? onTap;
  final SkyButtonKind kind;
  final double height, fontSize;
  final bool expand;
  @override
  State<SkyButton> createState() => _SkyButtonState();
}

class _SkyButtonState extends State<SkyButton>
    with SingleTickerProviderStateMixin {
  bool _down = false;
  // Only the primary button sweeps, so only it owns a ticker.
  AnimationController? _sheen;

  @override
  void initState() {
    super.initState();
    if (widget.kind == SkyButtonKind.primary) {
      _sheen = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 2600),
      )..repeat();
    }
  }

  @override
  void dispose() {
    _sheen?.dispose();
    super.dispose();
  }

  List<Color> get _fill => switch (widget.kind) {
    SkyButtonKind.primary => const [Color(0xffb6ef7a), Color(0xff57a52c)],
    SkyButtonKind.secondary => const [Color(0xfff7e8bd), Color(0xffd9bd84)],
    SkyButtonKind.danger => const [Color(0xffe98a6a), Color(0xffa83e29)],
    SkyButtonKind.ghost => const [Color(0x2affffff), Color(0x14000000)],
  };

  Color get _ink => switch (widget.kind) {
    SkyButtonKind.ghost => Sky.text,
    SkyButtonKind.danger => const Color(0xfffff1e6),
    _ => const Color(0xff22371c),
  };

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onTap != null;
    final radius = BorderRadius.circular(16);
    return Semantics(
      label: widget.label,
      button: true,
      enabled: enabled,
      child: GestureDetector(
        onTapDown: enabled ? (_) => setState(() => _down = true) : null,
        onTapUp: enabled ? (_) => setState(() => _down = false) : null,
        onTapCancel: enabled ? () => setState(() => _down = false) : null,
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _down ? .97 : 1,
          duration: const Duration(milliseconds: 90),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 140),
            width: widget.expand ? double.infinity : null,
            height: widget.height,
            padding: EdgeInsets.symmetric(horizontal: widget.expand ? 12 : 22),
            decoration: BoxDecoration(
              borderRadius: radius,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: enabled
                    ? _fill
                    : [const Color(0xff4a4336), const Color(0xff332f27)],
              ),
              border: Border.all(
                color: widget.kind == SkyButtonKind.ghost
                    ? Colors.white.withValues(alpha: .24)
                    : const Color(0xff2b3a1e),
                width: 1.6,
              ),
              boxShadow: _down || !enabled ? null : Sky.lift(.8),
            ),
            child: ClipRRect(
              borderRadius: radius,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Lit top edge: the cheapest way to read as a raised surface.
                  Positioned(
                    top: 0,
                    left: 10,
                    right: 10,
                    child: Container(
                      height: 1.2,
                      color: Colors.white.withValues(alpha: .34),
                    ),
                  ),
                  if (_sheen != null && enabled)
                    Positioned.fill(
                      child: AnimatedBuilder(
                        animation: _sheen!,
                        builder: (context, _) =>
                            CustomPaint(painter: _Sheen(_sheen!.value)),
                      ),
                    ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (widget.icon != null) ...[
                        Icon(
                          widget.icon,
                          size: widget.fontSize + 6,
                          color: enabled
                              ? _ink
                              : Sky.textSoft.withValues(alpha: .6),
                        ),
                        const SizedBox(width: 10),
                      ],
                      Flexible(
                        child: Text(
                          widget.label,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontFamily: Sky.display,
                            fontSize: widget.fontSize,
                            fontWeight: FontWeight.w800,
                            letterSpacing: .2,
                            color: enabled
                                ? _ink
                                : Sky.textSoft.withValues(alpha: .6),
                          ),
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
    );
  }
}

class _Sheen extends CustomPainter {
  _Sheen(this.time);
  final double time;
  @override
  void paint(Canvas canvas, Size size) {
    // One pass every few seconds, idle in between.
    final travel = (time * 3.2 - .6).clamp(-.6, 1.6);
    final x = travel * (size.width + 120) - 60;
    canvas.drawRect(
      Offset.zero & size,
      Paint()
        ..shader = ui.Gradient.linear(
          Offset(x - 50, 0),
          Offset(x + 50, size.height),
          [
            Colors.white.withValues(alpha: 0),
            Colors.white.withValues(alpha: .3),
            Colors.white.withValues(alpha: 0),
          ],
          [0, .5, 1],
        ),
    );
  }

  @override
  bool shouldRepaint(_Sheen old) => old.time != time;
}

/// Pill tabs for the pause menu. The selected pill slides, so switching reads
/// as moving along one row rather than four separate buttons lighting up.
class SegmentedTabs extends StatelessWidget {
  const SegmentedTabs({
    super.key,
    required this.labels,
    required this.index,
    required this.onChanged,
  });
  final List<String> labels;
  final int index;
  final ValueChanged<int> onChanged;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) {
      final slot = box.maxWidth / labels.length;
      return Container(
        height: 42,
        decoration: BoxDecoration(
          color: const Color(0x332a170b),
          borderRadius: Sky.pillRadius,
          border: Border.all(color: const Color(0x332a170b), width: 1.5),
        ),
        child: Stack(
          children: [
            AnimatedPositioned(
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOutCubic,
              left: slot * index + 3,
              top: 3,
              bottom: 3,
              width: slot - 6,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: Sky.pillRadius,
                  gradient: const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0xffb6ef7a), Color(0xff6cb73c)],
                  ),
                  boxShadow: Sky.lift(.5),
                ),
              ),
            ),
            Row(
              children: [
                for (final (i, label) in labels.indexed)
                  Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => onChanged(i),
                      child: Center(
                        child: Text(
                          label,
                          style: TextStyle(
                            fontFamily: Sky.display,
                            fontWeight: FontWeight.w800,
                            fontSize: 14,
                            color: i == index ? Sky.ink : Sky.inkSoft,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      );
    },
  );
}

/// A leaf-and-vine rule, used to separate blocks inside parchment panels.
class LeafDivider extends StatelessWidget {
  const LeafDivider({super.key, this.color = const Color(0x552a170b)});
  final Color color;
  @override
  Widget build(BuildContext context) =>
      SizedBox(height: 12, child: CustomPaint(painter: _LeafRule(color)));
}

class _LeafRule extends CustomPainter {
  _LeafRule(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    final y = size.height / 2;
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.4
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(0, y), Offset(size.width / 2 - 14, y), paint);
    canvas.drawLine(
      Offset(size.width / 2 + 14, y),
      Offset(size.width, y),
      paint,
    );
    final leaf = Path()
      ..moveTo(size.width / 2 - 9, y)
      ..quadraticBezierTo(size.width / 2, y - 7, size.width / 2 + 9, y)
      ..quadraticBezierTo(size.width / 2, y + 7, size.width / 2 - 9, y);
    canvas.drawPath(leaf, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_LeafRule old) => old.color != color;
}
