import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:skybound/ui/main_menu.dart';
import 'package:skybound/ui/tutorial.dart';

void main() {
  testWidgets('Small portrait menu scrolls clear of notch and navigation bar', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'skybound.save.v1': '{"version":1,"pr":{"seeds":3}}',
    });
    const size = Size(320, 480);
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(
      const MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(
            size: size,
            padding: EdgeInsets.fromLTRB(12, 44, 12, 34),
          ),
          child: MainMenu(),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));
    final scroll = find.byKey(const ValueKey('main-menu-scroll'));
    final viewport = tester.getRect(scroll);
    expect(viewport.top, greaterThanOrEqualTo(44));
    expect(viewport.bottom, lessThanOrEqualTo(480 - 34));
    expect(viewport.left, greaterThanOrEqualTo(12));
    expect(viewport.right, lessThanOrEqualTo(320 - 12));
    await tester.drag(scroll, const Offset(0, -500));
    await tester.pump(const Duration(seconds: 1));
    final reset = find.text('Reset progres');
    expect(reset.hitTestable(), findsOneWidget);
    expect(tester.getRect(reset).bottom, lessThanOrEqualTo(446));
    expect(tester.takeException(), isNull);
    await tester.pumpWidget(const SizedBox());
  });
  testWidgets('Tutorial can be skipped and reopened from the beginning', (
    tester,
  ) async {
    var done = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: TutorialOverlay(onDone: () => done++)),
      ),
    );
    expect(find.text('Selamat datang, Aera!'), findsOneWidget);
    await tester.tap(find.text('Lanjut'));
    await tester.pump();
    expect(find.text('Bergerak & melompat'), findsOneWidget);
    await tester.tap(find.text('Lewati'));
    expect(done, 1);
    await tester.pumpWidget(const SizedBox());
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: TutorialOverlay(onDone: () => done++)),
      ),
    );
    expect(find.text('Selamat datang, Aera!'), findsOneWidget);
    for (var i = 0; i < 3; i++) {
      await tester.tap(find.text('Lanjut'));
      await tester.pump();
    }
    await tester.tap(find.text('Ayo main!'));
    expect(done, 2);
  });
  for (final size in [const Size(320, 568), const Size(844, 390)]) {
    testWidgets(
      'Main menu fits safe area and reset requires confirmation at $size',
      (tester) async {
        SharedPreferences.setMockInitialValues({
          'skybound.save.v1': '{"version":1,"pr":{"seeds":3}}',
          'other.preference': true,
        });
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        await tester.pumpWidget(
          MaterialApp(
            home: MediaQuery(
              data: MediaQueryData(
                size: size,
                padding: const EdgeInsets.only(top: 24, bottom: 34),
              ),
              child: const MainMenu(),
            ),
          ),
        );
        await tester.pump(const Duration(milliseconds: 300));
        expect(tester.takeException(), isNull);
        expect(find.text('Lanjutkan petualangan'), findsOneWidget);
        await tester.ensureVisible(find.text('Reset progres'));
        await tester.tap(find.text('Reset progres'));
        await tester.pump(const Duration(milliseconds: 300));
        await tester.tap(find.text('Batal'));
        await tester.pump(const Duration(milliseconds: 300));
        final prefs = await SharedPreferences.getInstance();
        expect(prefs.containsKey('skybound.save.v1'), isTrue);
        await tester.tap(find.text('Reset progres'));
        await tester.pump(const Duration(milliseconds: 300));
        await tester.tap(find.widgetWithText(FilledButton, 'Reset progres'));
        await tester.pump(const Duration(milliseconds: 300));
        expect(prefs.containsKey('skybound.save.v1'), isFalse);
        expect(prefs.getBool('other.preference'), isTrue);
        expect(find.text('Mulai petualangan'), findsOneWidget);
        await tester.pumpWidget(const SizedBox());
      },
    );
  }
}
