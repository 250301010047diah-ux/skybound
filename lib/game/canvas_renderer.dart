import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/painting.dart';
import 'package:vector_math/vector_math_64.dart' show Matrix4;

Color parseColor(dynamic raw) {
  final text = raw?.toString() ?? '#000000';
  if (text.startsWith('#')) {
    var hex = text.substring(1);
    if (hex.length == 3) hex = hex.split('').map((c) => '$c$c').join();
    if (hex.length == 6) return Color(int.parse('ff$hex', radix: 16));
    if (hex.length == 8) {
      return Color(
        int.parse(hex.substring(6) + hex.substring(0, 6), radix: 16),
      );
    }
  }
  if (text.startsWith('rgb')) {
    final n = RegExp(
      r'[\d.]+',
    ).allMatches(text).map((m) => double.parse(m[0]!)).toList();
    return Color.fromRGBO(
      n[0].round(),
      n[1].round(),
      n[2].round(),
      n.length > 3 ? n[3] : 1,
    );
  }
  return switch (text) {
    'white' => const Color(0xffffffff),
    'transparent' => const Color(0x00000000),
    _ => const Color(0xff000000),
  };
}

class _Style {
  Map<String, dynamic> values = {
    'fillStyle': '#000000',
    'strokeStyle': '#000000',
    'lineWidth': 1.0,
    'globalAlpha': 1.0,
    'globalCompositeOperation': 'source-over',
    'lineCap': 'butt',
    'lineJoin': 'miter',
    'lineDashOffset': 0.0,
    'font': '10px sans-serif',
    'textAlign': 'start',
    'textBaseline': 'alphabetic',
  };
  List<double> dash = [];
  Matrix4 matrix = Matrix4.identity();
  _Style copy() => _Style()
    ..values = Map.of(values)
    ..dash = List.of(dash)
    ..matrix = matrix.clone();
}

/// Replays the original renderer's Canvas2D operations onto Flame's Canvas.
/// All geometry, sprite cropping, camera and draw ordering come from source.
class CanvasRenderer {
  CanvasRenderer(this.images, this.catalog);
  final Map<String, ui.Image> images;
  final Map<String, dynamic> catalog;
  final Map<String, TextPainter> _texts = {};
  final Map<String, Color> _colors = {};
  final Map<String, ui.Shader> _patterns = {};

  Color _color(dynamic value) =>
      _colors.putIfAbsent(value.toString(), () => parseColor(value));
  double _n(dynamic v) => (v as num).toDouble();

  Paint _paint(_Style s, bool stroke) {
    final values = s.values;
    final alpha = _n(values['globalAlpha']).clamp(0.0, 1.0);
    final paint = Paint()
      ..isAntiAlias = true
      ..filterQuality = FilterQuality.medium
      ..style = stroke ? PaintingStyle.stroke : PaintingStyle.fill
      ..strokeWidth = _n(values['lineWidth'])
      ..strokeCap = switch (values['lineCap']) {
        'round' => StrokeCap.round,
        'square' => StrokeCap.square,
        _ => StrokeCap.butt,
      }
      ..strokeJoin = switch (values['lineJoin']) {
        'round' => StrokeJoin.round,
        'bevel' => StrokeJoin.bevel,
        _ => StrokeJoin.miter,
      }
      ..blendMode = switch (values['globalCompositeOperation']) {
        'lighter' => BlendMode.plus,
        'screen' => BlendMode.screen,
        'multiply' => BlendMode.multiply,
        'destination-out' => BlendMode.dstOut,
        _ => BlendMode.srcOver,
      };
    final value = values[stroke ? 'strokeStyle' : 'fillStyle'];
    if (value is Map) {
      paint.color = Color.fromRGBO(255, 255, 255, alpha);
      if (value['kind'] == 'pattern') {
        final key = value['image'] as String;
        final image = images[key];
        if (image != null) {
          final m = (value['matrix'] as List).map(_n).toList();
          final scale = _n(catalog[key]['width']) / image.width;
          final cacheKey = '$key/${image.hashCode}/$m';
          paint.shader = _patterns.putIfAbsent(
            cacheKey,
            () => ui.ImageShader(
              image,
              TileMode.repeated,
              TileMode.repeated,
              Float64List.fromList([
                m[0] * scale,
                m[1] * scale,
                0,
                0,
                m[2] * scale,
                m[3] * scale,
                0,
                0,
                0,
                0,
                1,
                0,
                m[4],
                m[5],
                0,
                1,
              ]),
            ),
          );
        }
      } else {
        final stops = value['stops'] as List;
        final colors = stops.map((v) => _color(v[1])).toList();
        final positions = stops.map((v) => _n(v[0])).toList();
        final a = (value['args'] as List).map(_n).toList();
        if (value['kind'] == 'linear') {
          paint.shader = ui.Gradient.linear(
            Offset(a[0], a[1]),
            Offset(a[2], a[3]),
            colors,
            positions,
          );
        } else {
          paint.shader = ui.Gradient.radial(
            Offset(a[3], a[4]),
            math.max(a[5], 0.001),
            colors,
            positions,
            TileMode.clamp,
            null,
            Offset(a[0], a[1]),
            a[2],
          );
        }
      }
    } else {
      final color = _color(value);
      paint.color = color.withValues(alpha: color.a * alpha);
    }
    return paint;
  }

  Path _dashed(Path path, _Style s) {
    if (s.dash.isEmpty || s.dash.every((n) => n <= 0)) return path;
    final result = Path();
    final pattern = s.dash.length.isOdd ? [...s.dash, ...s.dash] : s.dash;
    for (final metric in path.computeMetrics()) {
      var pos = -_n(s.values['lineDashOffset']);
      var index = 0;
      while (pos < metric.length) {
        final length = math.max(0.01, pattern[index % pattern.length]);
        if (index.isEven && pos + length > 0) {
          result.addPath(
            metric.extractPath(
              math.max(0, pos),
              math.min(pos + length, metric.length),
            ),
            Offset.zero,
          );
        }
        pos += length;
        index++;
      }
    }
    return result;
  }

  void render(Canvas canvas, List<dynamic> commands) {
    final initial = canvas.getSaveCount();
    canvas.save();
    var s = _Style();
    final stack = <_Style>[];
    var path = Path();
    Offset? point;
    try {
      for (final raw in commands) {
        final c = raw as List;
        double n(int i) => _n(c[i]);
        switch (c[0]) {
          case '=':
            s.values[c[1] as String] = c[2];
          case 'save':
            canvas.save();
            stack.add(s.copy());
          case 'restore':
            if (stack.isNotEmpty) {
              canvas.restore();
              s = stack.removeLast();
            }
          case 'setTransform':
            final target = Matrix4.fromList([
              n(1),
              n(2),
              0,
              0,
              n(3),
              n(4),
              0,
              0,
              0,
              0,
              1,
              0,
              n(5),
              n(6),
              0,
              1,
            ]);
            final relative = Matrix4.inverted(s.matrix)..multiply(target);
            canvas.transform(relative.storage);
            s.matrix = target;
          case 'translate':
            canvas.translate(n(1), n(2));
            s.matrix.multiply(Matrix4.translationValues(n(1), n(2), 0));
          case 'scale':
            canvas.scale(n(1), n(2));
            s.matrix.multiply(Matrix4.diagonal3Values(n(1), n(2), 1));
          case 'rotate':
            canvas.rotate(n(1));
            s.matrix.multiply(Matrix4.rotationZ(n(1)));
          case 'beginPath':
            path = Path();
            point = null;
          case 'closePath':
            path.close();
          case 'moveTo':
            path.moveTo(n(1), n(2));
            point = Offset(n(1), n(2));
          case 'lineTo':
            path.lineTo(n(1), n(2));
            point = Offset(n(1), n(2));
          case 'quadraticCurveTo':
            path.quadraticBezierTo(n(1), n(2), n(3), n(4));
            point = Offset(n(3), n(4));
          case 'bezierCurveTo':
            path.cubicTo(n(1), n(2), n(3), n(4), n(5), n(6));
            point = Offset(n(5), n(6));
          case 'rect':
            path.addRect(Rect.fromLTWH(n(1), n(2), n(3), n(4)));
            point = Offset(n(1), n(2));
          case 'arc':
            final start = n(4), end = n(5);
            var sweep = end - start;
            final ccw = c.length > 6 && c[6] == true;
            if (ccw && sweep > 0) sweep -= math.pi * 2;
            if (!ccw && sweep < 0) sweep += math.pi * 2;
            sweep = sweep.clamp(-math.pi * 2, math.pi * 2);
            path.arcTo(
              Rect.fromCircle(center: Offset(n(1), n(2)), radius: n(3)),
              start,
              sweep,
              point == null,
            );
            point = Offset(
              n(1) + n(3) * math.cos(end),
              n(2) + n(3) * math.sin(end),
            );
          case 'ellipse':
            final start = n(6), end = n(7);
            var sweep = end - start;
            if (c.length > 8 && c[8] == true && sweep > 0) sweep -= math.pi * 2;
            if ((c.length <= 8 || c[8] != true) && sweep < 0) {
              sweep += math.pi * 2;
            }
            final oval = Path()
              ..addArc(
                Rect.fromCenter(
                  center: Offset.zero,
                  width: n(3) * 2,
                  height: n(4) * 2,
                ),
                start,
                sweep.clamp(-math.pi * 2, math.pi * 2),
              );
            final transform = Matrix4.translationValues(n(1), n(2), 0)
              ..multiply(Matrix4.rotationZ(n(5)));
            path.addPath(oval, Offset.zero, matrix4: transform.storage);
            point = Offset(n(1), n(2));
          case 'arcTo':
            final p1 = Offset(n(1), n(2)), p2 = Offset(n(3), n(4));
            final radius = n(5);
            if (point == null) {
              path.moveTo(p1.dx, p1.dy);
              point = p1;
              break;
            }
            final a = point - p1, b = p2 - p1;
            if (a.distance < 0.001 || b.distance < 0.001 || radius <= 0) {
              path.lineTo(p1.dx, p1.dy);
              point = p1;
              break;
            }
            final u = a / a.distance, v = b / b.distance;
            final angle = math.acos(
              (u.dx * v.dx + u.dy * v.dy).clamp(-1.0, 1.0),
            );
            if (angle < 0.001 || (angle - math.pi).abs() < 0.001) {
              path.lineTo(p1.dx, p1.dy);
              point = p1;
              break;
            }
            final distance = radius / math.tan(angle / 2),
                t1 = p1 + u * (radius / math.tan(angle / 2));
            final t2 = p1 + v * distance;
            path.lineTo(t1.dx, t1.dy);
            path.arcToPoint(
              t2,
              radius: Radius.circular(radius),
              clockwise: u.dx * v.dy - u.dy * v.dx < 0,
            );
            point = t2;
          case 'clip':
            canvas.clipPath(path);
          case 'fill':
            canvas.drawPath(path, _paint(s, false));
          case 'stroke':
            canvas.drawPath(_dashed(path, s), _paint(s, true));
          case 'fillRect':
            canvas.drawRect(
              Rect.fromLTWH(n(1), n(2), n(3), n(4)),
              _paint(s, false),
            );
          case 'strokeRect':
            canvas.drawRect(
              Rect.fromLTWH(n(1), n(2), n(3), n(4)),
              _paint(s, true),
            );
          case 'clearRect':
            canvas.drawRect(
              Rect.fromLTWH(n(1), n(2), n(3), n(4)),
              Paint()..blendMode = BlendMode.clear,
            );
          case 'setLineDash':
            s.dash = (c[1] as List).map(_n).toList();
          case 'drawImage':
            final key = c[1] as String, image = images[key];
            if (image == null) break;
            final logicalW = _n(catalog[key]['width']),
                logicalH = _n(catalog[key]['height']);
            Rect src, dst;
            if (c.length == 10) {
              src = Rect.fromLTWH(
                n(2) * image.width / logicalW,
                n(3) * image.height / logicalH,
                n(4) * image.width / logicalW,
                n(5) * image.height / logicalH,
              );
              dst = Rect.fromLTWH(n(6), n(7), n(8), n(9));
            } else {
              src = Rect.fromLTWH(
                0,
                0,
                image.width.toDouble(),
                image.height.toDouble(),
              );
              dst = Rect.fromLTWH(
                n(2),
                n(3),
                c.length > 4 ? n(4) : logicalW,
                c.length > 5 ? n(5) : logicalH,
              );
            }
            if (src.width > 0 &&
                src.height > 0 &&
                dst.width > 0 &&
                dst.height > 0) {
              canvas.drawImageRect(
                image,
                src,
                dst,
                Paint()
                  ..filterQuality = FilterQuality.medium
                  ..color = Color.fromRGBO(
                    255,
                    255,
                    255,
                    _n(s.values['globalAlpha']).clamp(0.0, 1.0),
                  ),
              );
            }
          case 'fillText':
          case 'strokeText':
            final text = c[1].toString(), font = s.values['font'] as String;
            final paint = _paint(s, c[0] == 'strokeText');
            final cache = '$text/$font/${paint.color.toARGB32()}/${c[0]}';
            if (_texts.length > 300) {
              for (final t in _texts.values) {
                t.dispose();
              }
              _texts.clear();
            }
            final tp = _texts.putIfAbsent(cache, () {
              final fontSize =
                  double.tryParse(
                    RegExp(r'([\d.]+)px').firstMatch(font)?.group(1) ?? '',
                  ) ??
                  12;
              return TextPainter(
                text: TextSpan(
                  text: text,
                  style: TextStyle(
                    fontSize: fontSize,
                    fontFamily: 'AeraDisplay',
                    fontWeight: font.contains('800')
                        ? FontWeight.w800
                        : FontWeight.w600,
                    foreground: paint,
                  ),
                ),
                textDirection: TextDirection.ltr,
              )..layout();
            });
            final dx = s.values['textAlign'] == 'center'
                ? -tp.width / 2
                : (s.values['textAlign'] == 'right' ||
                      s.values['textAlign'] == 'end')
                ? -tp.width
                : 0.0;
            final dy = s.values['textBaseline'] == 'middle'
                ? -tp.height / 2
                : s.values['textBaseline'] == 'top'
                ? 0.0
                : s.values['textBaseline'] == 'bottom'
                ? -tp.height
                : -tp.computeDistanceToActualBaseline(TextBaseline.alphabetic);
            tp.paint(canvas, Offset(n(2) + dx, n(3) + dy));
          default:
            throw UnsupportedError('Canvas operation ${c[0]}');
        }
      }
    } finally {
      canvas.restoreToCount(initial);
    }
  }

  void clearShaders() => _patterns.clear();
  void dispose() {
    for (final p in _texts.values) {
      p.dispose();
    }
    _texts.clear();
    _patterns.clear();
  }
}
