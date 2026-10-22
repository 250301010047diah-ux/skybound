part of 'game_screen.dart';

/// Paths copied from the original hud.js SVG vocabulary.
class ControlIconPainter extends CustomPainter {
  ControlIconPainter(this.icon, this.color);
  final IconData icon;
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 24, size.height / 24);
    final p = Path();
    if (icon == Icons.pause) {
      p
        ..moveTo(9, 6)
        ..lineTo(9, 18)
        ..moveTo(15, 6)
        ..lineTo(15, 18);
    } else if (icon == Icons.arrow_upward) {
      p
        ..moveTo(12, 19)
        ..lineTo(12, 6)
        ..moveTo(6, 11)
        ..lineTo(12, 5)
        ..lineTo(18, 11);
    } else if (icon == Icons.double_arrow) {
      p
        ..moveTo(4, 12)
        ..lineTo(16, 12)
        ..moveTo(12, 7)
        ..lineTo(17, 12)
        ..lineTo(12, 17)
        ..moveTo(4, 8)
        ..lineTo(9, 8)
        ..moveTo(4, 16)
        ..lineTo(9, 16);
    } else if (icon == Icons.my_location) {
      p
        ..moveTo(6, 3)
        ..cubicTo(12, 6, 15, 12, 12, 21)
        ..moveTo(6, 3)
        ..lineTo(12, 21)
        ..moveTo(9, 12)
        ..lineTo(21, 12)
        ..moveTo(18, 9)
        ..lineTo(21, 12)
        ..lineTo(18, 15);
    } else if (icon == Icons.north_east) {
      p
        ..moveTo(4, 20)
        ..lineTo(18, 6)
        ..moveTo(13, 5)
        ..lineTo(19, 5)
        ..lineTo(19, 11)
        ..moveTo(4, 16)
        ..lineTo(4, 20)
        ..lineTo(8, 20);
    } else {
      p
        ..moveTo(8, 13)
        ..lineTo(8, 6.5)
        ..arcToPoint(const Offset(11, 6.5), radius: const Radius.circular(1.5))
        ..lineTo(11, 12)
        ..moveTo(11, 11)
        ..lineTo(11, 5)
        ..arcToPoint(const Offset(14, 5), radius: const Radius.circular(1.5))
        ..lineTo(14, 11)
        ..moveTo(14, 11)
        ..lineTo(14, 6.5)
        ..arcToPoint(const Offset(17, 6.5), radius: const Radius.circular(1.5))
        ..lineTo(17, 14)
        ..cubicTo(17, 18, 14.5, 20, 11, 20)
        ..cubicTo(8.4, 20, 7, 18.6, 5.6, 16.4)
        ..lineTo(4, 13.6)
        ..cubicTo(3, 12, 5.5, 10.4, 6.5, 12)
        ..lineTo(8, 14);
    }
    canvas.drawPath(
      p,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.2
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(ControlIconPainter old) =>
      old.icon != icon || old.color != color;
}
