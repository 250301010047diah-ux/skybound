import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'ui/main_menu.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  runApp(const SkyboundApp());
}

class SkyboundApp extends StatelessWidget {
  const SkyboundApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Aera Skybound Roots',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      brightness: Brightness.dark,
      fontFamily: 'AeraDisplay',
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xff7ed957),
        brightness: Brightness.dark,
      ),
      scaffoldBackgroundColor: const Color(0xff1d140c),
    ),
    home: const MainMenu(),
  );
}
