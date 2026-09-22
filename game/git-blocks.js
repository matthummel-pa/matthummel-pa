/**
 * Git Blocks — a small tetris-style cabinet for Matt's GitHub profile.
 * Works in the browser (canvas player) and in Node (engine unit tests).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.GitBlocks = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const KINDS = ["I", "O", "T", "S", "Z", "J", "L"];
  const SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  };
  const META = {
    I: { label: "commit", color: "#5ec8d8" },
    O: { label: "stash", color: "#e7c35a" },
    T: { label: "merge", color: "#8b7ce0" },
    S: { label: "star", color: "#3d8b6e" },
    Z: { label: "hotfix", color: "#d45d5d" },
    J: { label: "branch", color: "#4f8fd4" },
    L: { label: "review", color: "#e08a4a" },
  };
  const CLEARS = {
    1: { points: 100, message: "feat: land a clean commit" },
    2: { points: 300, message: "fix: unstick the merge" },
    3: { points: 500, message: "refactor: smaller pieces" },
    4: { points: 800, message: "chore: ship the whole stack" },
  };
  const KICKS = [0, -1, 1, -2, 2];

  function cloneMatrix(matrix) {
    return matrix.map((row) => row.slice());
  }

  function rotate(matrix, dir) {
    const n = matrix.length;
    const next = Array.from({ length: n }, () => Array(n).fill(0));
    for (let y = 0; y < n; y += 1) {
      for (let x = 0; x < n; x += 1) {
        if (dir >= 0) {
          next[x][n - 1 - y] = matrix[y][x];
        } else {
          next[n - 1 - x][y] = matrix[y][x];
        }
      }
    }
    return next;
  }

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function pieceCells(piece) {
    const cells = [];
    piece.matrix.forEach((row, y) => {
      row.forEach((on, x) => {
        if (on) cells.push({ x: piece.x + x, y: piece.y + y });
      });
    });
    return cells;
  }

  function collides(board, piece) {
    return pieceCells(piece).some(({ x, y }) => {
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y < 0) return false;
      return Boolean(board[y][x]);
    });
  }

  function spawnX(kind) {
    const width = SHAPES[kind][0].length;
    return Math.floor((COLS - width) / 2);
  }

  function makePiece(kind) {
    return {
      kind,
      matrix: cloneMatrix(SHAPES[kind]),
      x: spawnX(kind),
      y: kind === "I" ? -1 : 0,
    };
  }

  function clearLines(board) {
    const kept = board.filter((row) => row.some((cell) => cell == null));
    const cleared = ROWS - kept.length;
    while (kept.length < ROWS) {
      kept.unshift(Array(COLS).fill(null));
    }
    return { board: kept, cleared };
  }

  function scoreForClears(cleared, level, combo) {
    const base = (CLEARS[cleared] || { points: 0 }).points;
    const comboBonus = cleared ? combo * 50 * level : 0;
    return base * level + comboBonus;
  }

  function gravityMs(level, reducedMotion) {
    const base = Math.max(120, 900 - (level - 1) * 80);
    return reducedMotion ? base + 220 : base;
  }

  function shuffleBag(random) {
    const bag = KINDS.slice();
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const tmp = bag[i];
      bag[i] = bag[j];
      bag[j] = tmp;
    }
    return bag;
  }

  function createGame(options = {}) {
    const random = options.random || Math.random;
    const now = options.now || (() => Date.now());
    let bag = [];
    const state = {
      board: emptyBoard(),
      active: null,
      hold: null,
      holdUsed: false,
      queue: [],
      score: 0,
      lines: 0,
      level: 1,
      combo: 0,
      status: "ready",
      message: "Press play to start committing.",
      dropMs: gravityMs(1, Boolean(options.reducedMotion)),
      lastTick: 0,
      lockAt: 0,
      reducedMotion: Boolean(options.reducedMotion),
    };

    function fillQueue() {
      while (state.queue.length < 5) {
        if (bag.length === 0) bag = shuffleBag(random);
        state.queue.push(bag.pop());
      }
    }

    function spawn(opts = {}) {
      fillQueue();
      const kind = state.queue.shift();
      fillQueue();
      const piece = makePiece(kind);
      if (collides(state.board, piece)) {
        state.status = "over";
        state.active = piece;
        state.message = "Merge conflict. Press R to rebase.";
        return false;
      }
      state.active = piece;
      if (!opts.keepHoldUsed) state.holdUsed = false;
      state.lockAt = 0;
      return true;
    }

    function tryMove(dx, dy) {
      if (!state.active || state.status !== "playing") return false;
      const next = {
        ...state.active,
        x: state.active.x + dx,
        y: state.active.y + dy,
      };
      if (collides(state.board, next)) return false;
      state.active = next;
      if (dy > 0) state.lockAt = 0;
      return true;
    }

    function tryRotate(dir) {
      if (!state.active || state.status !== "playing") return false;
      if (state.active.kind === "O") return true;
      const rotated = rotate(state.active.matrix, dir);
      for (const kick of KICKS) {
        const next = { ...state.active, matrix: rotated, x: state.active.x + kick };
        if (!collides(state.board, next)) {
          state.active = next;
          return true;
        }
      }
      return false;
    }

    function lockPiece() {
      if (!state.active) return;
      pieceCells(state.active).forEach(({ x, y }) => {
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
          state.board[y][x] = state.active.kind;
        }
      });
      const result = clearLines(state.board);
      state.board = result.board;
      if (result.cleared) {
        state.combo += 1;
        state.lines += result.cleared;
        state.level = 1 + Math.floor(state.lines / 10);
        state.dropMs = gravityMs(state.level, state.reducedMotion);
        state.score += scoreForClears(result.cleared, state.level, state.combo);
        state.message = CLEARS[result.cleared].message;
      } else {
        state.combo = 0;
      }
      spawn();
    }

    function hardDrop() {
      if (!state.active || state.status !== "playing") return 0;
      let dropped = 0;
      while (tryMove(0, 1)) dropped += 1;
      state.score += dropped * 2;
      lockPiece();
      return dropped;
    }

    function softDrop() {
      if (!tryMove(0, 1)) return false;
      state.score += 1;
      return true;
    }

    function hold() {
      if (!state.active || state.holdUsed || state.status !== "playing") return false;
      const current = state.active.kind;
      if (state.hold) {
        const swapped = makePiece(state.hold);
        if (collides(state.board, swapped)) return false;
        state.active = swapped;
      } else if (!spawn({ keepHoldUsed: true })) {
        return false;
      }
      state.hold = current;
      state.holdUsed = true;
      return true;
    }

    function ghost() {
      if (!state.active) return null;
      const shadow = {
        ...state.active,
        matrix: cloneMatrix(state.active.matrix),
      };
      while (!collides(state.board, { ...shadow, y: shadow.y + 1 })) {
        shadow.y += 1;
      }
      return shadow;
    }

    function tick(ts) {
      if (state.status !== "playing" || !state.active) return;
      if (!state.lastTick) state.lastTick = ts;
      if (ts - state.lastTick < state.dropMs) return;
      state.lastTick = ts;
      if (!tryMove(0, 1)) {
        if (!state.lockAt) state.lockAt = ts;
        if (ts - state.lockAt >= 450) lockPiece();
      }
    }

    function play() {
      if (state.status === "playing") return;
      if (state.status === "over") reset();
      state.status = "playing";
      state.message = "Drop commits. Clear the backlog.";
      state.lastTick = now();
      if (!state.active) spawn();
    }

    function pause() {
      if (state.status !== "playing") return;
      state.status = "paused";
      state.message = "Working tree paused.";
    }

    function resume() {
      if (state.status !== "paused") return;
      state.status = "playing";
      state.lastTick = now();
      state.message = "Back on the main branch.";
    }

    function reset() {
      state.board = emptyBoard();
      state.active = null;
      state.hold = null;
      state.holdUsed = false;
      state.queue = [];
      state.score = 0;
      state.lines = 0;
      state.level = 1;
      state.combo = 0;
      state.status = "ready";
      state.message = "Press play to start committing.";
      state.dropMs = gravityMs(1, state.reducedMotion);
      state.lastTick = 0;
      state.lockAt = 0;
      bag = [];
      fillQueue();
    }

    function snapshot() {
      return {
        board: state.board.map((row) => row.slice()),
        active: state.active
          ? { ...state.active, matrix: cloneMatrix(state.active.matrix) }
          : null,
        ghost: ghost(),
        hold: state.hold,
        queue: state.queue.slice(0, 3),
        score: state.score,
        lines: state.lines,
        level: state.level,
        combo: state.combo,
        status: state.status,
        message: state.message,
      };
    }

    fillQueue();
    return {
      COLS,
      ROWS,
      play,
      pause,
      resume,
      reset,
      tick,
      tryMove,
      tryRotate,
      hardDrop,
      softDrop,
      hold,
      snapshot,
      get status() {
        return state.status;
      },
      get score() {
        return state.score;
      },
    };
  }

  function prefersReducedMotion() {
    return Boolean(
      typeof matchMedia === "function" &&
        matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawCell(ctx, x, y, size, color, ghost) {
    const pad = Math.max(1, Math.floor(size * 0.08));
    ctx.save();
    ctx.globalAlpha = ghost ? 0.28 : 1;
    roundedRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, size * 0.18);
    ctx.fillStyle = color;
    ctx.fill();
    if (!ghost) {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      roundedRect(
        ctx,
        x + pad + 2,
        y + pad + 2,
        (size - pad * 2) * 0.42,
        (size - pad * 2) * 0.28,
        3
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function boot(root) {
    if (!root || typeof document === "undefined") return null;
    const canvas = root.querySelector("[data-board]");
    const overlay = root.querySelector("[data-overlay]");
    const overlayTitle = root.querySelector("[data-overlay-title]");
    const overlayBody = root.querySelector("[data-overlay-body]");
    const playBtn = root.querySelector("[data-play]");
    const messageEl = root.querySelector("[data-message]");
    const scoreEl = root.querySelector("[data-score]");
    const linesEl = root.querySelector("[data-lines]");
    const levelEl = root.querySelector("[data-level]");
    const highEl = root.querySelector("[data-high]");
    const holdEl = root.querySelector("[data-hold]");
    const nextEl = root.querySelector("[data-next]");
    const liveEl = root.querySelector("[data-live]");
    const muteBtn = root.querySelector("[data-mute]");
    const pauseBtn = root.querySelector("[data-pause]");
    if (!canvas) return null;

    const storageKey = "git-blocks-high-score";
    let high = 0;
    try {
      high = Number(localStorage.getItem(storageKey) || 0);
    } catch (_err) {
      high = 0;
    }

    const game = createGame({ reducedMotion: prefersReducedMotion() });
    const ctx = canvas.getContext("2d");
    let muted = false;
    let audioCtx = null;
    let raf = 0;

    function beep(kind) {
      if (muted || typeof AudioContext === "undefined") return;
      audioCtx = audioCtx || new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;
      const tones = { move: 420, rotate: 560, drop: 220, clear: 740, start: 640 };
      osc.frequency.value = tones[kind] || 440;
      osc.type = kind === "clear" ? "triangle" : "square";
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    function miniCanvas(kind) {
      const node = document.createElement("canvas");
      node.width = 72;
      node.height = 72;
      node.setAttribute("aria-hidden", "true");
      const c = node.getContext("2d");
      c.fillStyle = "#0b1220";
      c.fillRect(0, 0, 72, 72);
      if (!kind) return node;
      const matrix = SHAPES[kind];
      const cell = 14;
      const w = matrix[0].length * cell;
      const h = matrix.length * cell;
      const ox = Math.floor((72 - w) / 2);
      const oy = Math.floor((72 - h) / 2);
      matrix.forEach((row, y) => {
        row.forEach((on, x) => {
          if (on) drawCell(c, ox + x * cell, oy + y * cell, cell, META[kind].color, false);
        });
      });
      return node;
    }

    function paintMini(el, kinds) {
      if (!el) return;
      el.replaceChildren();
      kinds.forEach((kind) => {
        const wrap = document.createElement("div");
        wrap.className = "gb-mini";
        wrap.appendChild(miniCanvas(kind));
        const cap = document.createElement("span");
        cap.textContent = kind ? META[kind].label : "empty";
        wrap.appendChild(cap);
        el.appendChild(wrap);
      });
    }

    function sizeCanvas() {
      const wrap = canvas.parentElement;
      const cssWidth = Math.max(180, Math.min(wrap.clientWidth, 360));
      const cell = Math.floor(cssWidth / COLS);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = COLS * cell * dpr;
      canvas.height = ROWS * cell * dpr;
      canvas.style.width = `${COLS * cell}px`;
      canvas.style.height = `${ROWS * cell}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return cell;
    }

    function draw() {
      const cell = sizeCanvas();
      const snap = game.snapshot();
      ctx.fillStyle = "#07111f";
      ctx.fillRect(0, 0, COLS * cell, ROWS * cell);
      ctx.strokeStyle = "rgba(207,217,230,0.08)";
      for (let x = 0; x <= COLS; x += 1) {
        ctx.beginPath();
        ctx.moveTo(x * cell + 0.5, 0);
        ctx.lineTo(x * cell + 0.5, ROWS * cell);
        ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y += 1) {
        ctx.beginPath();
        ctx.moveTo(0, y * cell + 0.5);
        ctx.lineTo(COLS * cell, y * cell + 0.5);
        ctx.stroke();
      }
      snap.board.forEach((row, y) => {
        row.forEach((kind, x) => {
          if (kind) drawCell(ctx, x * cell, y * cell, cell, META[kind].color, false);
        });
      });
      if (snap.ghost && snap.active) {
        pieceCells(snap.ghost).forEach(({ x, y }) => {
          if (y >= 0) drawCell(ctx, x * cell, y * cell, cell, META[snap.active.kind].color, true);
        });
      }
      if (snap.active) {
        pieceCells(snap.active).forEach(({ x, y }) => {
          if (y >= 0) drawCell(ctx, x * cell, y * cell, cell, META[snap.active.kind].color, false);
        });
      }
      if (scoreEl) scoreEl.textContent = String(snap.score);
      if (linesEl) linesEl.textContent = String(snap.lines);
      if (levelEl) levelEl.textContent = String(snap.level);
      if (highEl) highEl.textContent = String(Math.max(high, snap.score));
      if (messageEl) messageEl.textContent = snap.message;
      paintMini(holdEl, [snap.hold]);
      paintMini(nextEl, snap.queue);
      if (overlay && overlayTitle && overlayBody) {
        const show = snap.status !== "playing";
        overlay.hidden = !show;
        if (snap.status === "ready") {
          overlayTitle.textContent = "Git Blocks";
          overlayBody.textContent = "Stack commits. Clear lines. Don’t let the backlog reach production.";
          if (playBtn) playBtn.textContent = "Play";
        } else if (snap.status === "paused") {
          overlayTitle.textContent = "Paused";
          overlayBody.textContent = snap.message;
          if (playBtn) playBtn.textContent = "Resume";
        } else if (snap.status === "over") {
          overlayTitle.textContent = "Merge conflict";
          overlayBody.textContent = `Score ${snap.score}. Press play to rebase.`;
          if (playBtn) playBtn.textContent = "Rebase";
        }
      }
      if (pauseBtn) {
        pauseBtn.textContent = snap.status === "paused" ? "Resume" : "Pause";
        pauseBtn.disabled = snap.status === "ready" || snap.status === "over";
      }
    }

    function persistHigh() {
      high = Math.max(high, game.score);
      try {
        localStorage.setItem(storageKey, String(high));
      } catch (_err) {
        /* ignore private mode */
      }
    }

    function announce(text) {
      if (liveEl) liveEl.textContent = text;
    }

    function startLoop() {
      cancelAnimationFrame(raf);
      const loop = (ts) => {
        game.tick(ts);
        if (game.status === "over") persistHigh();
        draw();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function handlePlay() {
      if (game.status === "paused") {
        game.resume();
      } else {
        game.play();
        beep("start");
        announce("Git Blocks started");
      }
      canvas.focus();
    }

    function handlePause() {
      if (game.status === "playing") {
        game.pause();
        announce("Paused");
      } else if (game.status === "paused") {
        game.resume();
      }
    }

    root.querySelectorAll("[data-move]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const move = btn.getAttribute("data-move");
        if (move === "left") game.tryMove(-1, 0);
        if (move === "right") game.tryMove(1, 0);
        if (move === "down") {
          if (!game.softDrop()) beep("drop");
        }
        if (move === "rotate") {
          game.tryRotate(1);
          beep("rotate");
        }
        if (move === "drop") {
          game.hardDrop();
          beep("drop");
        }
        if (move === "hold") game.hold();
        draw();
      });
    });

    if (playBtn) playBtn.addEventListener("click", handlePlay);
    if (pauseBtn) pauseBtn.addEventListener("click", handlePause);
    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        muted = !muted;
        muteBtn.setAttribute("aria-pressed", String(muted));
        muteBtn.textContent = muted ? "Sound off" : "Sound on";
      });
    }

    function onKey(event) {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " ", "w", "a", "s", "d", "z", "x", "c", "p", "m", "r"];
      if (!keys.includes(event.key) && event.key !== "Shift") return;
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(event.key)) {
        event.preventDefault();
      }
      if (event.key === "p") {
        handlePause();
        return;
      }
      if (event.key === "m") {
        if (muteBtn) muteBtn.click();
        return;
      }
      if (event.key === "r" && game.status === "over") {
        handlePlay();
        return;
      }
      if (game.status !== "playing") {
        if (event.key === " " || event.key === "Enter") handlePlay();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "a") game.tryMove(-1, 0);
      if (event.key === "ArrowRight" || event.key === "d") game.tryMove(1, 0);
      if (event.key === "ArrowDown" || event.key === "s") game.softDrop();
      if (event.key === "ArrowUp" || event.key === "x" || event.key === "w") {
        game.tryRotate(1);
        beep("rotate");
      }
      if (event.key === "z") game.tryRotate(-1);
      if (event.key === " ") {
        game.hardDrop();
        beep("drop");
      }
      if (event.key === "c" || event.key === "Shift") game.hold();
      draw();
    }

    canvas.addEventListener("keydown", onKey);
    window.addEventListener("keydown", (event) => {
      if (event.target && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
      onKey(event);
    });

    let touchStart = null;
    canvas.addEventListener("touchstart", (event) => {
      const t = event.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY, at: Date.now() };
    }, { passive: true });
    canvas.addEventListener("touchend", (event) => {
      if (!touchStart) return;
      const t = event.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      const dt = Date.now() - touchStart.at;
      touchStart = null;
      if (game.status !== "playing") {
        handlePlay();
        return;
      }
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24 && dt < 250) {
        game.tryRotate(1);
        beep("rotate");
      } else if (Math.abs(dx) > Math.abs(dy)) {
        game.tryMove(dx > 0 ? 1 : -1, 0);
      } else if (dy > 0) {
        game.softDrop();
      } else {
        game.hardDrop();
        beep("drop");
      }
      draw();
    }, { passive: true });

    window.addEventListener("resize", draw);
    startLoop();
    draw();
    return game;
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      const root = document.querySelector("[data-git-blocks]");
      if (root) boot(root);
    });
  }

  return {
    COLS,
    ROWS,
    SHAPES,
    META,
    CLEARS,
    rotate,
    collides,
    clearLines,
    scoreForClears,
    makePiece,
    createGame,
    boot,
  };
});
