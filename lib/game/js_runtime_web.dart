import 'dart:js_interop';

@JS('eval')
external JSAny? _eval(JSString source);

/// Flutter Web uses the browser JS VM, while Flame still paints the game.
class GameRuntime {
  String evaluate(String code) {
    final value = _eval(code.toJS);
    return value?.dartify()?.toString() ?? '';
  }

  Future<void> flush() => Future<void>.delayed(Duration.zero);
  void pump() {}
  void dispose() {}
}
