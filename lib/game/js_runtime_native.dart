import 'package:flutter_js/flutter_js.dart';

/// Local, bundled game code only; no fetch or downloaded executable code.
class GameRuntime {
  final JavascriptRuntime _runtime = getJavascriptRuntime(xhr: false);

  String evaluate(String code) {
    final result = _runtime.evaluate(code);
    if (result.isError) throw StateError(result.stringResult);
    return result.stringResult;
  }

  Future<void> flush() async {
    for (var i = 0; i < 8; i++) {
      _runtime.executePendingJob();
    }
    await Future<void>.delayed(Duration.zero);
  }

  void pump() {
    for (var i = 0; i < 8; i++) {
      if (_runtime.executePendingJob() <= 0) break;
    }
  }

  void dispose() => _runtime.dispose();
}
