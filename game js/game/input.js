// Player intent only. Handlers record what the player wants into this object;
// update() reads it and clears the one-shot flags with consume(). Nothing here
// moves the game, so a frozen game stays frozen.
export function createInput(root) {
  const inp = {
    keys: {},
    stickX: 0,
    stickY: 0,
    jumpHeld: false,
    jumpPressed: false,
    dashPressed: false,
    interactPressed: false,
    cyclePressed: false,
    pausePressed: false,
    advancePressed: false,
    aim: { active: false, source: null, dx: 0, dy: 0, mx: 0, my: 0 },
    fireReleased: false,
    firstGesture: false,
    touchUsed: false,
    listeners: [],
  };
  const on = (el, ev, fn, opts) => {
    el.addEventListener(ev, fn, opts);
    inp.listeners.push(() => el.removeEventListener(ev, fn, opts));
  };
  const gesture = () => {
    inp.firstGesture = true;
  };

  // ---------------------------------------------------------------- keyboard
  const KEYMAP = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down",
  };
  on(window, "keydown", (e) => {
    if (e.repeat) return;
    gesture();
    const k = KEYMAP[e.code];
    if (k) inp.keys[k] = true;
    if (e.code === "Space") {
      inp.jumpHeld = true;
      inp.jumpPressed = true;
      inp.advancePressed = true;
      e.preventDefault();
    }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "KeyL") inp.dashPressed = true;
    if (e.code === "KeyE" || e.code === "Enter") {
      inp.interactPressed = true;
      inp.advancePressed = true;
    }
    if (e.code === "KeyQ" || e.code === "Tab") {
      inp.cyclePressed = true;
      e.preventDefault();
    }
    if (e.code === "Escape" || e.code === "KeyP") inp.pausePressed = true;
    if (e.code === "KeyJ" || e.code === "KeyK") {
      inp.aim.active = true;
      inp.aim.source = "keys";
    }
  });
  on(window, "keyup", (e) => {
    const k = KEYMAP[e.code];
    if (k) inp.keys[k] = false;
    if (e.code === "Space") inp.jumpHeld = false;
    if ((e.code === "KeyJ" || e.code === "KeyK") && inp.aim.source === "keys") {
      inp.aim.active = false;
      inp.fireReleased = true;
    }
  });
  on(window, "blur", () => {
    inp.keys = {};
    inp.jumpHeld = false;
  });

  // ---------------------------------------------------------------- mouse aim on the canvas
  const canvas = root.querySelector("canvas");
  on(canvas, "pointerdown", (e) => {
    gesture();
    if (e.pointerType !== "mouse") {
      inp.touchUsed = true;
      inp.advancePressed = true;
      return;
    }
    if (e.button !== 0) return;
    inp.advancePressed = true;
    inp.aim.active = true;
    inp.aim.source = "mouse";
    inp.aim.mx = e.clientX;
    inp.aim.my = e.clientY;
    canvas.setPointerCapture?.(e.pointerId);
  });
  on(canvas, "pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    inp.aim.mx = e.clientX;
    inp.aim.my = e.clientY;
  });
  const mouseUp = (e) => {
    if (e.pointerType !== "mouse") return;
    if (inp.aim.active && inp.aim.source === "mouse") {
      inp.aim.active = false;
      inp.fireReleased = true;
    }
  };
  on(canvas, "pointerup", mouseUp);
  on(canvas, "pointercancel", mouseUp);
  on(canvas, "contextmenu", (e) => e.preventDefault());

  // ---------------------------------------------------------------- virtual stick
  const stick = root.querySelector(".stick");
  const knob = root.querySelector(".stick-knob");
  let stickId = null;
  let base = { x: 0, y: 0, r: 40 };
  const setKnob = (dx, dy) => {
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  };
  on(stick, "pointerdown", (e) => {
    gesture();
    inp.touchUsed = inp.touchUsed || e.pointerType !== "mouse";
    e.preventDefault();
    stickId = e.pointerId;
    stick.setPointerCapture?.(e.pointerId);
    const r = stick.querySelector(".stick-base").getBoundingClientRect();
    base = { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width * 0.42 };
    moveStick(e);
  });
  const moveStick = (e) => {
    if (e.pointerId !== stickId) return;
    let dx = e.clientX - base.x;
    let dy = e.clientY - base.y;
    const len = Math.hypot(dx, dy);
    if (len > base.r) {
      dx = (dx / len) * base.r;
      dy = (dy / len) * base.r;
    }
    setKnob(dx, dy);
    const nx = dx / base.r;
    const ny = dy / base.r;
    inp.stickX = Math.abs(nx) > 0.28 ? Math.sign(nx) * Math.min(1, (Math.abs(nx) - 0.18) / 0.6) : 0;
    inp.stickY = Math.abs(ny) > 0.45 ? Math.sign(ny) : 0;
  };
  on(stick, "pointermove", moveStick);
  const endStick = (e) => {
    if (e.pointerId !== stickId) return;
    stickId = null;
    inp.stickX = 0;
    inp.stickY = 0;
    setKnob(0, 0);
  };
  on(stick, "pointerup", endStick);
  on(stick, "pointercancel", endStick);

  // ---------------------------------------------------------------- buttons
  const press = (sel, down, up) => {
    const el = root.querySelector(sel);
    if (!el) return;
    on(el, "pointerdown", (e) => {
      gesture();
      inp.touchUsed = inp.touchUsed || e.pointerType !== "mouse";
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      el.classList.add("pressed");
      down(e, el);
    });
    const release = (e) => {
      el.classList.remove("pressed");
      up?.(e, el);
    };
    on(el, "pointerup", release);
    on(el, "pointercancel", release);
  };
  press(
    ".act-jump",
    () => {
      inp.jumpHeld = true;
      inp.jumpPressed = true;
      inp.advancePressed = true;
    },
    () => {
      inp.jumpHeld = false;
    },
  );
  press(".act-dash", () => {
    inp.dashPressed = true;
  });
  press(".act-interact", () => {
    inp.interactPressed = true;
    inp.advancePressed = true;
  });
  press(".slot-btn", () => {
    inp.cyclePressed = true;
  });
  press(".pause-btn", () => {
    inp.pausePressed = true;
  });
  // Bow: press to draw, drag to aim (drag direction = shot direction), release to loose.
  let bowOrigin = null;
  let bowId = null;
  press(
    ".act-bow",
    (e) => {
      bowOrigin = { x: e.clientX, y: e.clientY };
      bowId = e.pointerId;
      inp.aim.active = true;
      inp.aim.source = "button";
      inp.aim.dx = 0;
      inp.aim.dy = 0;
    },
    (e) => {
      if (e.pointerId !== bowId) return;
      bowId = null;
      if (inp.aim.source === "button") {
        inp.aim.active = false;
        inp.fireReleased = true;
      }
    },
  );
  const bowEl = root.querySelector(".act-bow");
  if (bowEl)
    on(bowEl, "pointermove", (e) => {
      if (e.pointerId !== bowId || !bowOrigin) return;
      inp.aim.dx = e.clientX - bowOrigin.x;
      inp.aim.dy = e.clientY - bowOrigin.y;
    });

  inp.axisX = () => {
    const k = (inp.keys.right ? 1 : 0) - (inp.keys.left ? 1 : 0);
    return k !== 0 ? k : inp.stickX;
  };
  inp.axisY = () => {
    const k = (inp.keys.down ? 1 : 0) - (inp.keys.up ? 1 : 0);
    return k !== 0 ? k : inp.stickY;
  };
  inp.consume = () => {
    inp.jumpPressed = false;
    inp.dashPressed = false;
    inp.interactPressed = false;
    inp.cyclePressed = false;
    inp.pausePressed = false;
    inp.advancePressed = false;
    inp.fireReleased = false;
  };
  inp.destroy = () => {
    for (const off of inp.listeners) off();
    inp.listeners = [];
  };
  return inp;
}
