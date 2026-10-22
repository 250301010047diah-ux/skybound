import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:skybound/game/canvas_renderer.dart';
import 'package:skybound/game/skybound_game.dart';
import 'package:skybound/ui/game_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final frame =
      jsonDecode(File('test/fixtures/first_frame.json').readAsStringSync())
          as Map<String, dynamic>;
  test(
    'Flame canvas renders actual source commands and sprite crops',
    () async {
      final catalog =
          jsonDecode(File('assets/json/catalog.json').readAsStringSync())
              as Map<String, dynamic>;
      final images = <String, ui.Image>{};
      final commands = frame['commands'] as List;
      final keys = <String>{};
      for (final c in commands) {
        if (c[0] == 'drawImage') keys.add(c[1] as String);
        if (c[0] == '=' && c[2] is Map && c[2]['kind'] == 'pattern') {
          keys.add(c[2]['image'] as String);
        }
      }
      for (final key in keys) {
        final codec = await ui.instantiateImageCodec(
          File('assets/images/${catalog[key]['file']}').readAsBytesSync(),
        );
        images[key] = (await codec.getNextFrame()).image;
        codec.dispose();
      }
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      final renderer = CanvasRenderer(images, catalog);
      renderer.render(canvas, commands);
      final picture = recorder.endRecording();
      final result = await picture.toImage(960, 540);
      final bytes = await result.toByteData(format: ui.ImageByteFormat.png);
      expect(bytes, isNotNull);
      expect(bytes!.lengthInBytes, greaterThan(20000));
      Directory('.dart_tool/skybound_checks').createSync(recursive: true);
      File(
        '.dart_tool/skybound_checks/flame_frame.png',
      ).writeAsBytesSync(bytes.buffer.asUint8List());
      renderer.dispose();
      result.dispose();
      picture.dispose();
      for (final image in images.values) {
        image.dispose();
      }
    },
  );
  for (final size in [
    const Size(390, 844),
    const Size(844, 390),
    const Size(320, 568),
  ]) {
    testWidgets('HUD, pause tabs and multi-touch fit $size', (tester) async {
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final game = SkyboundGame();
      final hud = Map<String, dynamic>.from(frame['hud'] as Map);
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GameHud(game: game, hud: hud),
          ),
        ),
      );
      expect(tester.takeException(), isNull);
      final jump = find.bySemanticsLabel('Lompat');
      final gesture = await tester.startGesture(tester.getCenter(jump));
      await tester.pump();
      expect(game.input.jumpHeld, isTrue);
      await gesture.up();
      await tester.pump();
      expect(game.input.jumpHeld, isFalse);
      await tester.tap(find.bySemanticsLabel('Jeda'));
      expect(game.input.pressed, contains('pausePressed'));
      await tester.tap(find.bySemanticsLabel('Bisukan suara'));
      expect(game.input.actions.last['type'], 'settings');
      expect(game.input.actions.last['mute'], isTrue);
      hud['menu'] = 'pause';
      hud['map'] = null;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GameHud(game: game, hud: hud),
          ),
        ),
      );
      expect(tester.takeException(), isNull);
      await tester.tap(find.text('Bantuan'));
      await tester.pump();
      expect(tester.takeException(), isNull);
      await tester.tap(find.text('Suara'));
      await tester.pump();
      expect(tester.takeException(), isNull);
      await tester.tap(find.text('Lanjut'));
      expect(game.input.actions.last['type'], 'resume');
    });
  }
}
