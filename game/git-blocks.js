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
  // SRS-lite kicks: try in place, then nudge on X/Y so wall/floor spins succeed.
  const KICKS = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [-2, 0],
    [2, 0],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
    [-2, -1],
    [2, -1],
    [0, -2],
  ];

  function cloneMatrix(matrix) {
    return matrix.map((row) => row.slice());
  }

  function rotate(matrix, dir) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const size = Math.max(rows, cols);
    const square = Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => (matrix[y] && matrix[y][x] ? 1 : 0))
    );
    const next = Array.from({ length: size }, () => Array(size).fill(0));
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (dir >= 0) {
          next[x][size - 1 - y] = square[y][x];
        } else {
          next[size - 1 - x][y] = square[y][x];
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
      rotation: 0,
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

  // Classic-style gravity: starts leisurely, ramps hard each level.
  const GRAVITY_TABLE_MS = [
    900, 780, 660, 540, 440, 360, 290, 240, 195, 160, 130, 105, 88, 74, 62, 52, 44, 38, 32, 28,
  ];

  function gravityMs(level, reducedMotion) {
    const idx = Math.max(1, Math.min(level, GRAVITY_TABLE_MS.length)) - 1;
    const base = GRAVITY_TABLE_MS[idx];
    return reducedMotion ? Math.round(base * 1.35) : base;
  }

  function lockDelayMs(level) {
    return Math.max(180, 520 - (Math.max(1, level) - 1) * 28);
  }

  function linesPerLevel() {
    return 8;
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
      message: "Starting level 1…",
      dropMs: gravityMs(1, Boolean(options.reducedMotion)),
      lastTick: 0,
      lockAt: 0,
      levelFlash: 0,
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
      // O looks the same after rotation; treat as success so controls feel responsive.
      if (state.active.kind === "O") {
        state.lockAt = 0;
        return true;
      }
      const rotated = rotate(state.active.matrix, dir);
      for (const [kx, ky] of KICKS) {
        const next = {
          ...state.active,
          matrix: rotated,
          x: state.active.x + kx,
          y: state.active.y + ky,
          rotation: ((state.active.rotation || 0) + (dir >= 0 ? 1 : 3)) % 4,
        };
        if (!collides(state.board, next)) {
          state.active = next;
          state.lockAt = 0;
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
        const nextLevel = 1 + Math.floor(state.lines / linesPerLevel());
        if (nextLevel > state.level) {
          const prevDrop = state.dropMs;
          state.level = nextLevel;
          state.dropMs = gravityMs(state.level, state.reducedMotion);
          state.levelFlash = now();
          state.message = `Level ${state.level} — gravity ${prevDrop}→${state.dropMs}ms`;
        } else {
          state.message = CLEARS[result.cleared].message;
          state.dropMs = gravityMs(state.level, state.reducedMotion);
        }
        state.score += scoreForClears(result.cleared, state.level, state.combo);
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
        if (ts - state.lockAt >= lockDelayMs(state.level)) lockPiece();
      }
    }

    function play() {
      if (state.status === "playing") return;
      if (state.status === "over") reset();
      state.status = "playing";
      state.message = `Level ${state.level} — drop commits.`;
      state.lastTick = now();
      state.levelFlash = now();
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
      state.message = "Starting level 1…";
      state.dropMs = gravityMs(1, state.reducedMotion);
      state.lastTick = 0;
      state.lockAt = 0;
      state.levelFlash = 0;
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
        levelFlash: state.levelFlash,
        dropMs: state.dropMs,
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

  const STORAGE = {
    high: 'git-blocks-high-score',
    prefs: 'git-blocks-prefs-v1',
  };

  const ACTION_OPTIONS = [
    { id: 'left', label: 'Move left' },
    { id: 'right', label: 'Move right' },
    { id: 'down', label: 'Soft drop' },
    { id: 'drop', label: 'Hard drop' },
    { id: 'rotate', label: 'Rotate CW' },
    { id: 'rotate-ccw', label: 'Rotate CCW' },
    { id: 'hold', label: 'Hold' },
    { id: 'none', label: 'Do nothing' },
  ];

  const KEY_ACTIONS = [
    { id: 'left', label: 'Move left' },
    { id: 'right', label: 'Move right' },
    { id: 'down', label: 'Soft drop' },
    { id: 'drop', label: 'Hard drop' },
    { id: 'rotate', label: 'Rotate CW' },
    { id: 'rotateCcw', label: 'Rotate CCW' },
    { id: 'hold', label: 'Hold' },
    { id: 'pause', label: 'Pause' },
    { id: 'mute', label: 'Mute SFX' },
  ];

  const DEFAULT_BINDINGS = {
    keys: {
      left: ['ArrowLeft', 'a', 'A'],
      right: ['ArrowRight', 'd', 'D'],
      down: ['ArrowDown', 's', 'S'],
      drop: [' '],
      rotate: ['ArrowUp', 'x', 'X', 'w', 'W'],
      rotateCcw: ['z', 'Z'],
      hold: ['c', 'C'],
      pause: ['p', 'P'],
      mute: ['m', 'M'],
    },
    mouse: {
      leftClick: 'down',
      rightClick: 'rotate',
      middleClick: 'drop',
      wheel: 'move',
      doubleClick: 'drop',
      edgeClick: 'move',
      drag: 'move',
    },
  };

  const BG_PRESETS = [
    {
      id: 'navy',
      label: 'Navy',
      pattern: 'drift',
      css: 'radial-gradient(900px 420px at 8% -8%, rgba(79,143,212,.22), transparent 55%), radial-gradient(700px 360px at 100% 0%, rgba(13,46,87,.55), transparent 48%), #0b1220',
    },
    {
      id: 'solid-ink',
      label: 'Ink',
      pattern: 'rise',
      css: '#0b1220',
    },
    {
      id: 'solid-navy',
      label: 'Deep',
      pattern: 'cross',
      css: '#0d2e57',
    },
    {
      id: 'aurora',
      label: 'Aurora',
      pattern: 'orbit',
      css: 'linear-gradient(135deg, #07111f 0%, #123b2e 40%, #0d2e57 75%, #1a1030 100%)',
    },
    {
      id: 'sunset',
      label: 'Merge',
      pattern: 'sway',
      css: 'linear-gradient(160deg, #1a0f14, #3a1d2e 45%, #0d2e57 100%)',
    },
    {
      id: 'grid',
      label: 'Grid',
      pattern: 'scan',
      css: 'linear-gradient(rgba(79,143,212,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(79,143,212,.08) 1px, transparent 1px), #0b1220',
    },
    {
      id: 'terminal',
      label: 'Term',
      pattern: 'rise',
      css: 'radial-gradient(circle at 30% 20%, rgba(61,139,110,.35), transparent 40%), #07140f',
    },
    {
      id: 'paper',
      label: 'Paper',
      pattern: 'drift',
      css: 'linear-gradient(180deg, #e8eef6, #c5d3e6)',
    },
  ];

  const DEV_CLOUD_WORDS = {
    css: ['flex', 'grid', 'clamp()', ':root', 'var(--navy)', '@media', 'gap', 'aspect-ratio', '::before', 'container', 'oklch()', 'subgrid'],
    php: ['foreach', 'namespace', '??=', 'match()', 'PDO', 'Composer', 'strict_types', 'yield', 'enum', 'readonly'],
    wordpress: ['add_action', 'WP_Query', 'the_content', 'block.json', 'get_posts', 'shortcode', 'hooks', 'REST', 'Sage', 'Blade'],
    react: ['useState', 'useEffect', 'JSX', 'props', 'memo', 'Suspense', 'useRef', 'Fragment', 'hooks', 'Server Component'],
    general: ['git merge', 'CI', 'API', 'GraphQL', 'TypeScript', 'PR', 'lint', 'deploy', 'a11y', 'Core Web Vitals'],
  };

  // Free / open catalog: generated loops + CC0 remote samples (CORS-friendly where possible).
  const OPEN_SOURCE_POOL = [
    { id: 'chip', label: 'Chip commit', kind: 'generated', style: 'chip', credit: 'Procedural chip loop — MIT, in-browser.' },
    { id: 'pad', label: 'Soft backlog pad', kind: 'generated', style: 'pad', credit: 'Procedural pad loop — MIT, in-browser.' },
    { id: 'pulse', label: 'Merge pulse', kind: 'generated', style: 'pulse', credit: 'Procedural pulse loop — MIT, in-browser.' },
    { id: 'arcade', label: 'Arcade rebase', kind: 'generated', style: 'arcade', credit: 'Procedural arcade loop — MIT, in-browser.' },
    { id: 'ambient', label: 'Idle deploy hum', kind: 'generated', style: 'ambient', credit: 'Procedural ambient hum — MIT, in-browser.' },
    { id: 'glitch', label: 'Hotfix glitch', kind: 'generated', style: 'glitch', credit: 'Procedural glitch loop — MIT, in-browser.' },
    {
      id: 'cc0-keys',
      label: 'CC0 keys (remote)',
      kind: 'url',
      url: 'https://cdn.jsdelivr.net/gh/anars/blank-audio@master/250-milliseconds-of-silence.mp3',
      credit: 'Silence placeholder used when remote CC0 hosts block hotlinking — shuffle regenerates free loops.',
    },
  ];

  const MUSIC_TRACKS_BASE = [
    { id: 'off', label: 'Music off', kind: 'off', credit: 'Silence — focus mode.' },
    { id: 'custom', label: 'Custom open-source URL…', kind: 'custom', credit: 'Paste a CC0 / CC-BY MP3 or OGG URL you have rights to stream.' },
  ];

  let MUSIC_TRACKS = MUSIC_TRACKS_BASE.slice();

  function shuffleArray(list, random) {
    const arr = list.slice();
    const rnd = random || Math.random;
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function discoverFreeTracks(count) {
    const pool = shuffleArray(OPEN_SOURCE_POOL);
    const picked = pool.slice(0, Math.max(3, count || 5)).map((track, i) => ({
      ...track,
      id: `${track.id}-r${i}-${Math.floor(Math.random() * 9999)}`,
      label: `${track.label} · free`,
      discovered: true,
    }));
    MUSIC_TRACKS = MUSIC_TRACKS_BASE.slice(0, 1).concat(picked, MUSIC_TRACKS_BASE.slice(1));
    return MUSIC_TRACKS;
  }

  discoverFreeTracks(5);

  function defaultPrefs() {
    return {
      bindings: JSON.parse(JSON.stringify(DEFAULT_BINDINGS)),
      background: { mode: 'preset', presetId: 'navy', css: BG_PRESETS[0].css, image: '' },
      music: { trackId: 'off', customUrl: '', volume: 0.35 },
    };
  }

  function loadPrefs() {
    const base = defaultPrefs();
    try {
      const raw = localStorage.getItem(STORAGE.prefs);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      return {
        bindings: {
          keys: Object.assign({}, base.bindings.keys, (parsed.bindings && parsed.bindings.keys) || {}),
          mouse: Object.assign({}, base.bindings.mouse, (parsed.bindings && parsed.bindings.mouse) || {}),
        },
        background: Object.assign({}, base.background, parsed.background || {}),
        music: Object.assign({}, base.music, parsed.music || {}),
      };
    } catch (_err) {
      return base;
    }
  }

  function savePrefs(prefs) {
    try {
      localStorage.setItem(STORAGE.prefs, JSON.stringify(prefs));
    } catch (_err) {
      /* private mode */
    }
  }

  function keyLabel(key) {
    if (key === ' ') return 'Space';
    if (key.startsWith('Arrow')) return key.replace('Arrow', '');
    return key.length === 1 ? key.toUpperCase() : key;
  }

  function randomGradient() {
    const hues = [
      Math.floor(Math.random() * 360),
      Math.floor(Math.random() * 360),
      Math.floor(Math.random() * 360),
    ];
    const a = `hsl(${hues[0]} 42% 14%)`;
    const b = `hsl(${hues[1]} 48% 22%)`;
    const c = `hsl(${hues[2]} 40% 10%)`;
    return `linear-gradient(${120 + Math.floor(Math.random() * 80)}deg, ${a}, ${b} 55%, ${c})`;
  }

  function prefersReducedMotion() {
    return Boolean(
      typeof matchMedia === 'function' &&
        matchMedia('(prefers-reduced-motion: reduce)').matches
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
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
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

  function createMusicEngine() {
    let audioCtx = null;
    let master = null;
    let nodes = [];
    let timer = 0;
    let style = 'chip';
    let playing = false;
    let volume = 0.35;
    let htmlAudio = null;
    let previewTimer = 0;

    function ensure() {
      if (typeof AudioContext === 'undefined') return null;
      audioCtx = audioCtx || new AudioContext();
      if (!master) {
        master = audioCtx.createGain();
        master.gain.value = volume;
        master.connect(audioCtx.destination);
      }
      return audioCtx;
    }

    function stopGenerated() {
      nodes.forEach((n) => {
        try {
          n.stop();
        } catch (_e) {
          /* already stopped */
        }
        try {
          n.disconnect();
        } catch (_e2) {
          /* ignore */
        }
      });
      nodes = [];
      if (timer) {
        clearInterval(timer);
        timer = 0;
      }
    }

    function stopAll() {
      stopGenerated();
      if (previewTimer) {
        clearTimeout(previewTimer);
        previewTimer = 0;
      }
      if (htmlAudio) {
        htmlAudio.pause();
        htmlAudio.src = '';
        htmlAudio = null;
      }
      playing = false;
    }

    function setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (master) master.gain.value = volume;
      if (htmlAudio) htmlAudio.volume = volume;
    }

    function blip(ctx, freq, type, start, dur, amp) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(amp, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + dur + 0.02);
      nodes.push(osc);
    }

    function scheduleChip(ctx) {
      const now = ctx.currentTime;
      [196, 247, 294, 392, 294, 247].forEach((freq, i) => {
        blip(ctx, freq, 'square', now + i * 0.22, 0.18, 0.05);
      });
    }

    function schedulePad(ctx) {
      const now = ctx.currentTime;
      [130.81, 164.81, 196].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.03 - i * 0.005, now + 0.8);
        gain.gain.linearRampToValueAtTime(0.0001, now + 2.4);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 2.5);
        nodes.push(osc);
      });
    }

    function schedulePulse(ctx) {
      const now = ctx.currentTime;
      for (let i = 0; i < 4; i += 1) {
        blip(ctx, i % 2 === 0 ? 98 : 147, 'triangle', now + i * 0.35, 0.28, 0.06);
      }
    }

    function scheduleArcade(ctx) {
      const now = ctx.currentTime;
      [262, 330, 392, 523, 392, 330, 294, 262].forEach((freq, i) => {
        blip(ctx, freq, 'square', now + i * 0.14, 0.12, 0.045);
      });
    }

    function scheduleAmbient(ctx) {
      const now = ctx.currentTime;
      [110, 138.59, 164.81].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0.018 - i * 0.003;
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 3.2);
        nodes.push(osc);
      });
    }

    function scheduleGlitch(ctx) {
      const now = ctx.currentTime;
      for (let i = 0; i < 10; i += 1) {
        const freq = 180 + Math.random() * 640;
        blip(ctx, freq, Math.random() > 0.5 ? 'sawtooth' : 'square', now + i * 0.09, 0.06, 0.035);
      }
    }

    function runStyle(ctx) {
      if (style === 'pad') schedulePad(ctx);
      else if (style === 'pulse') schedulePulse(ctx);
      else if (style === 'arcade') scheduleArcade(ctx);
      else if (style === 'ambient') scheduleAmbient(ctx);
      else if (style === 'glitch') scheduleGlitch(ctx);
      else scheduleChip(ctx);
    }

    function intervalForStyle() {
      if (style === 'pad' || style === 'ambient') return 2800;
      if (style === 'arcade') return 1200;
      if (style === 'glitch') return 1000;
      return 1400;
    }

    function startGenerated(nextStyle) {
      const ctx = ensure();
      if (!ctx) return false;
      stopAll();
      style = nextStyle || style;
      playing = true;
      const beat = () => {
        if (!playing) return;
        stopGenerated();
        playing = true;
        runStyle(ctx);
      };
      beat();
      timer = setInterval(beat, intervalForStyle());
      return true;
    }

    function startUrl(url) {
      stopAll();
      if (!url) return false;
      htmlAudio = new Audio(url);
      htmlAudio.loop = true;
      htmlAudio.volume = volume;
      htmlAudio.play().catch(() => {
        /* autoplay blocked — fall back to a free generated loop */
        startGenerated('ambient');
      });
      playing = true;
      return true;
    }

    function previewGenerated(nextStyle, ms) {
      const ctx = ensure();
      if (!ctx) return false;
      const wasPlaying = playing;
      const prevStyle = style;
      stopGenerated();
      style = nextStyle || 'chip';
      playing = true;
      runStyle(ctx);
      if (previewTimer) clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        stopGenerated();
        playing = wasPlaying;
        style = prevStyle;
        if (wasPlaying) startGenerated(prevStyle);
      }, ms || 1800);
      return true;
    }

    function previewSfx(kind, beepFn) {
      if (typeof beepFn === 'function') beepFn(kind);
    }

    return {
      setVolume,
      stop: stopAll,
      playGenerated: startGenerated,
      playUrl: startUrl,
      previewGenerated,
      previewSfx,
      get playing() {
        return playing;
      },
    };
  }

  function flatDevWords() {
    return []
      .concat(DEV_CLOUD_WORDS.css, DEV_CLOUD_WORDS.php, DEV_CLOUD_WORDS.wordpress, DEV_CLOUD_WORDS.react, DEV_CLOUD_WORDS.general);
  }

  function patternForBackground(bg) {
    if (bg.mode === 'preset') {
      const preset = BG_PRESETS.find((p) => p.id === bg.presetId);
      return (preset && preset.pattern) || 'drift';
    }
    if (bg.mode === 'image') return 'sway';
    return 'orbit';
  }

  function mountDevClouds(host, pattern) {
    if (!host) return;
    const words = shuffleArray(flatDevWords()).slice(0, 22);
    host.className = `dev-clouds pattern-${pattern || 'drift'}`;
    host.replaceChildren();
    words.forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'dev-cloud';
      span.textContent = word;
      span.style.left = `${4 + Math.random() * 90}%`;
      span.style.top = `${6 + Math.random() * 84}%`;
      span.style.animationDelay = `${(-Math.random() * 18).toFixed(2)}s`;
      span.style.animationDuration = `${14 + Math.random() * 18}s`;
      span.style.fontSize = `${0.7 + Math.random() * 0.85}rem`;
      span.style.opacity = String(0.18 + Math.random() * 0.35);
      span.dataset.lang = i % 5 === 0 ? 'css' : i % 5 === 1 ? 'php' : i % 5 === 2 ? 'wp' : i % 5 === 3 ? 'react' : 'dev';
      host.appendChild(span);
    });
  }

  function applyBackground(bg, rootEl) {
    const target = document.documentElement;
    let value = bg.css || BG_PRESETS[0].css;
    if (bg.mode === 'image' && bg.image) {
      value = `linear-gradient(rgba(7,17,31,.55), rgba(7,17,31,.72)), url("${bg.image.replace(/"/g, '')}") center / cover no-repeat fixed`;
    } else if (bg.mode === 'css' && bg.css) {
      value = bg.css;
    } else if (bg.mode === 'preset') {
      const preset = BG_PRESETS.find((p) => p.id === bg.presetId) || BG_PRESETS[0];
      value = preset.css;
      bg.css = preset.css;
    }
    target.style.setProperty('--gb-backdrop', value);
    const pattern = patternForBackground(bg);
    target.dataset.gbPattern = pattern;
    if (rootEl && rootEl.closest) {
      const embed = rootEl.closest('.git-blocks-embed');
      if (embed) {
        embed.style.setProperty('--gb-backdrop', value);
        embed.dataset.gbPattern = pattern;
      }
      const clouds = rootEl.querySelector('[data-dev-clouds]') || document.querySelector('[data-dev-clouds]');
      mountDevClouds(clouds, pattern);
    }
  }

  function readConfig() {
    const cfg = (typeof window !== 'undefined' && window.GitBlocksConfig) || {};
    return {
      shareUrl:
        cfg.shareUrl ||
        (typeof location !== 'undefined' ? `${location.origin}${location.pathname}` : 'https://matthummel.com/git-blocks/'),
      autoStart: cfg.autoStart !== false,
      layout: cfg.layout || 'viewport',
    };
  }

  function encodeShareHash(prefs, includePrefs) {
    if (!includePrefs) return '';
    const payload = {
      bg: prefs.background,
      music: { trackId: prefs.music.trackId, customUrl: prefs.music.customUrl, volume: prefs.music.volume },
    };
    try {
      return `#gb=${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`;
    } catch (_err) {
      return '';
    }
  }

  function decodeShareHash() {
    if (typeof location === 'undefined') return null;
    const m = location.hash.match(/#gb=([^&]+)/);
    if (!m) return null;
    try {
      return JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    } catch (_err) {
      return null;
    }
  }

  function boot(root, options = {}) {
    if (!root || typeof document === 'undefined') return null;
    const canvas = root.querySelector('[data-board]');
    if (!canvas) return null;

    const cfg = Object.assign({}, readConfig(), options);
    const prefs = loadPrefs();
    const shared = decodeShareHash();
    if (shared) {
      if (shared.bg) prefs.background = Object.assign({}, prefs.background, shared.bg);
      if (shared.music) prefs.music = Object.assign({}, prefs.music, shared.music);
    }

    const overlay = root.querySelector('[data-overlay]');
    const overlayTitle = root.querySelector('[data-overlay-title]');
    const overlayBody = root.querySelector('[data-overlay-body]');
    const overlayLevel = root.querySelector('[data-overlay-level]');
    const playBtn = root.querySelector('[data-play]');
    const messageEl = root.querySelector('[data-message]');
    const scoreEl = root.querySelector('[data-score]');
    const linesEl = root.querySelector('[data-lines]');
    const levelEl = root.querySelector('[data-level]');
    const highEl = root.querySelector('[data-high]');
    const holdEl = root.querySelector('[data-hold]');
    const nextEl = root.querySelector('[data-next]');
    const liveEl = root.querySelector('[data-live]');
    const muteBtn = root.querySelector('[data-mute]');
    const pauseBtn = root.querySelector('[data-pause]');
    const customizeBtn = root.querySelector('[data-customize]');
    const shareBtn = root.querySelector('[data-share]');
    const panel = root.querySelector('[data-customize-panel]');
    const keysHelp = root.querySelector('[data-keys-help]');

    let high = 0;
    try {
      high = Number(localStorage.getItem(STORAGE.high) || 0);
    } catch (_err) {
      high = 0;
    }

    const game = createGame({ reducedMotion: prefersReducedMotion() });
    const ctx = canvas.getContext('2d');
    const music = createMusicEngine();
    let muted = false;
    let sfxCtx = null;
    let raf = 0;
    let lastLevelShown = 1;
    let autoStarted = false;
    let listeningAction = null;
    let wheelAcc = 0;
    let dragState = null;
    let lastClickAt = 0;

    applyBackground(prefs.background, root);
    music.setVolume(prefs.music.volume || 0.35);

    if (!prefersReducedMotion()) {
      window.setInterval(() => {
        root.ownerDocument.querySelectorAll('[data-dev-clouds] .dev-cloud').forEach((el) => {
          const pool = flatDevWords();
          el.textContent = pool[Math.floor(Math.random() * pool.length)];
        });
      }, 4200);
    }

    function beep(kind) {
      if (muted || typeof AudioContext === 'undefined') return;
      try {
        sfxCtx = sfxCtx || new AudioContext();
        const osc = sfxCtx.createOscillator();
        const gain = sfxCtx.createGain();
        const t = sfxCtx.currentTime;
        const tones = { move: 420, rotate: 560, drop: 220, clear: 740, start: 640 };
        osc.frequency.value = tones[kind] || 440;
        osc.type = kind === 'clear' ? 'triangle' : 'square';
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(gain);
        gain.connect(sfxCtx.destination);
        osc.start(t);
        osc.stop(t + 0.12);
      } catch (_err) {
        /* ignore */
      }
    }

    function miniCanvas(kind) {
      const node = document.createElement('canvas');
      node.width = 72;
      node.height = 72;
      node.setAttribute('aria-hidden', 'true');
      const c = node.getContext('2d');
      c.fillStyle = '#0b1220';
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
        const wrap = document.createElement('div');
        wrap.className = 'gb-mini';
        wrap.appendChild(miniCanvas(kind));
        const cap = document.createElement('span');
        cap.textContent = kind ? META[kind].label : 'empty';
        wrap.appendChild(cap);
        el.appendChild(wrap);
      });
    }

    function sizeCanvas() {
      const wrap = canvas.parentElement;
      const availW = Math.max(120, wrap.clientWidth - 8);
      const availH = Math.max(160, wrap.clientHeight - 8);
      const cell = Math.max(8, Math.min(Math.floor(availW / COLS), Math.floor(availH / ROWS)));
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
      ctx.fillStyle = '#07111f';
      ctx.fillRect(0, 0, COLS * cell, ROWS * cell);
      ctx.strokeStyle = 'rgba(207,217,230,0.08)';
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

      const flashAge = snap.levelFlash ? Date.now() - snap.levelFlash : 9999;
      const showLevelBanner = snap.status === 'playing' && flashAge < 900;
      if (overlay && overlayTitle && overlayBody) {
        const show = snap.status !== 'playing' || showLevelBanner;
        overlay.hidden = !show;
        overlay.classList.toggle('is-clickable', snap.status !== 'playing');
        if (overlayLevel) {
          overlayLevel.hidden = !(showLevelBanner || snap.status === 'ready');
          overlayLevel.textContent = `Level ${snap.level}`;
        }
        if (showLevelBanner && snap.status === 'playing') {
          overlayTitle.textContent = 'Gravity up';
          overlayBody.textContent = `Level ${snap.level}. Pieces fall faster every 8 lines — concept game for fun.`;
          if (playBtn) playBtn.hidden = true;
        } else if (snap.status === 'ready') {
          overlayTitle.textContent = 'Git Blocks';
          overlayBody.textContent =
            "Concept game for fun — not a real job simulator. Stack commits, clear lines, don't ship the backlog.";
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = 'Play';
          }
        } else if (snap.status === 'paused') {
          overlayTitle.textContent = 'Paused';
          overlayBody.textContent = snap.message;
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = 'Resume';
          }
        } else if (snap.status === 'over') {
          overlayTitle.textContent = 'Merge conflict';
          overlayBody.textContent = `Score ${snap.score}. Press play or R to rebase.`;
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = 'Rebase';
          }
        }
      }
      if (snap.level !== lastLevelShown && snap.status === 'playing') {
        lastLevelShown = snap.level;
        announce(`Level ${snap.level}`);
      }
      if (pauseBtn) {
        pauseBtn.textContent = snap.status === 'paused' ? 'Resume' : 'Pause';
        pauseBtn.disabled = snap.status === 'ready' || snap.status === 'over';
      }
    }

    function persistHigh() {
      high = Math.max(high, game.score);
      try {
        localStorage.setItem(STORAGE.high, String(high));
      } catch (_err) {
        /* ignore */
      }
    }

    function announce(text) {
      if (liveEl) liveEl.textContent = text;
    }

    function startLoop() {
      cancelAnimationFrame(raf);
      const loop = (ts) => {
        game.tick(ts);
        if (game.status === 'over') persistHigh();
        draw();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function handlePlay() {
      if (game.status === 'paused') game.resume();
      else {
        game.play();
        beep('start');
        announce(`Level ${game.snapshot().level} started`);
      }
      canvas.focus({ preventScroll: true });
    }

    function handlePause() {
      if (game.status === 'playing') {
        game.pause();
        announce('Paused');
      } else if (game.status === 'paused') game.resume();
    }

    function applyMove(move) {
      if (!move || move === 'none') return;
      if (game.status !== 'playing') {
        if (['rotate', 'rotate-ccw', 'drop', 'down'].includes(move)) handlePlay();
        return;
      }
      if (move === 'left' && game.tryMove(-1, 0)) beep('move');
      if (move === 'right' && game.tryMove(1, 0)) beep('move');
      if (move === 'down') {
        if (!game.softDrop()) beep('drop');
      }
      if (move === 'rotate' && game.tryRotate(1)) beep('rotate');
      if (move === 'rotate-ccw' && game.tryRotate(-1)) beep('rotate');
      if (move === 'drop') {
        game.hardDrop();
        beep('drop');
      }
      if (move === 'hold') game.hold();
      draw();
    }

    function actionFromKey(key) {
      const map = prefs.bindings.keys;
      for (const action of Object.keys(map)) {
        if ((map[action] || []).includes(key)) return action;
      }
      return null;
    }

    function isEditableTarget(target) {
      if (!target || !target.tagName) return false;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName)) {
        if (target.closest && target.closest('[data-customize-panel]')) return true;
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true;
      }
      return Boolean(target.isContentEditable);
    }

    function onKey(event) {
      if (listeningAction) {
        event.preventDefault();
        if (event.key === 'Escape') {
          listeningAction = null;
          renderBindingsUi();
          return;
        }
        const next = event.key;
        if (next === 'Shift' || next === 'Meta' || next === 'Control' || next === 'Alt') return;
        // remove key from other actions
        Object.keys(prefs.bindings.keys).forEach((action) => {
          prefs.bindings.keys[action] = (prefs.bindings.keys[action] || []).filter((k) => k !== next);
        });
        prefs.bindings.keys[listeningAction] = [next];
        listeningAction = null;
        savePrefs(prefs);
        renderBindingsUi();
        updateKeysHelp();
        return;
      }

      if (isEditableTarget(event.target)) return;
      if (panel && !panel.hidden && event.key === 'Escape') {
        closeCustomize();
        return;
      }

      const action = actionFromKey(event.key);
      if (!action && event.key !== 'Enter' && event.key !== 'r' && event.key !== 'R') return;
      event.preventDefault();

      if (action === 'pause') {
        handlePause();
        return;
      }
      if (action === 'mute') {
        if (muteBtn) muteBtn.click();
        return;
      }
      if ((event.key === 'r' || event.key === 'R') && game.status === 'over') {
        handlePlay();
        return;
      }
      if (game.status !== 'playing') {
        if (event.key === 'Enter' || action === 'drop' || action === 'rotate') handlePlay();
        return;
      }
      if (action === 'left') applyMove('left');
      if (action === 'right') applyMove('right');
      if (action === 'down') applyMove('down');
      if (action === 'drop') applyMove('drop');
      if (action === 'rotate') applyMove('rotate');
      if (action === 'rotateCcw') applyMove('rotate-ccw');
      if (action === 'hold') applyMove('hold');
    }

    function boardPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        w: rect.width,
        h: rect.height,
      };
    }

    function onContextMenu(event) {
      event.preventDefault();
      if (game.status !== 'playing') {
        handlePlay();
        return;
      }
      applyMove(prefs.bindings.mouse.rightClick || 'rotate');
    }

    function onPointerDown(event) {
      if (event.button === 2) return;
      if (event.button === 1) {
        event.preventDefault();
        applyMove(prefs.bindings.mouse.middleClick || 'drop');
        return;
      }
      if (event.button !== 0) return;
      const now = Date.now();
      const pt = boardPoint(event);
      dragState = { x: pt.x, y: pt.y, moved: false, col: Math.floor((pt.x / pt.w) * COLS) };

      if (now - lastClickAt < 280) {
        applyMove(prefs.bindings.mouse.doubleClick || 'drop');
        lastClickAt = 0;
        dragState = null;
        return;
      }
      lastClickAt = now;

      if (prefs.bindings.mouse.edgeClick === 'move') {
        if (pt.x < pt.w * 0.22) applyMove('left');
        else if (pt.x > pt.w * 0.78) applyMove('right');
      }
    }

    function onPointerMove(event) {
      if (!dragState || prefs.bindings.mouse.drag !== 'move') return;
      if (game.status !== 'playing') return;
      const pt = boardPoint(event);
      const col = Math.floor((pt.x / pt.w) * COLS);
      if (col !== dragState.col) {
        const dir = col > dragState.col ? 1 : -1;
        const steps = Math.min(3, Math.abs(col - dragState.col));
        for (let i = 0; i < steps; i += 1) applyMove(dir > 0 ? 'right' : 'left');
        dragState.col = col;
        dragState.moved = true;
      }
    }

    function onPointerUp(event) {
      if (!dragState) return;
      const moved = dragState.moved;
      dragState = null;
      if (moved) return;
      if (event.button === 0) applyMove(prefs.bindings.mouse.leftClick || 'down');
    }

    function onWheel(event) {
      event.preventDefault();
      if (game.status !== 'playing') {
        handlePlay();
        return;
      }
      const mode = prefs.bindings.mouse.wheel || 'move';
      wheelAcc += event.deltaY + event.deltaX;
      const step = 40;
      while (Math.abs(wheelAcc) >= step) {
        const dir = wheelAcc > 0 ? 1 : -1;
        wheelAcc -= dir * step;
        if (mode === 'move') applyMove(dir > 0 ? 'right' : 'left');
        else if (mode === 'down') applyMove('down');
        else if (mode === 'rotate') applyMove(dir > 0 ? 'rotate' : 'rotate-ccw');
      }
    }

    function updateKeysHelp() {
      if (!keysHelp) return;
      const k = prefs.bindings.keys;
      keysHelp.innerHTML = `Scroll ${prefs.bindings.mouse.wheel} · right-click ${prefs.bindings.mouse.rightClick} · <kbd>${keyLabel(
        (k.left || ['←'])[0]
      )}</kbd>/<kbd>${keyLabel((k.right || ['→'])[0])}</kbd> move · <kbd>${keyLabel(
        (k.rotate || ['↑'])[0]
      )}</kbd> rotate`;
    }

    function renderBindingsUi() {
      const keyHost = root.querySelector('[data-key-bindings]');
      const mouseHost = root.querySelector('[data-mouse-bindings]');
      if (keyHost) {
        keyHost.replaceChildren();
        KEY_ACTIONS.forEach((action) => {
          const row = document.createElement('div');
          row.className = 'binding-row';
          const label = document.createElement('label');
          label.textContent = action.label;
          const btn = document.createElement('button');
          btn.type = 'button';
          const keys = prefs.bindings.keys[action.id] || [];
          btn.textContent =
            listeningAction === action.id ? 'Press a key…' : keys.map(keyLabel).join(', ') || '—';
          if (listeningAction === action.id) btn.classList.add('listening');
          btn.addEventListener('click', () => {
            listeningAction = action.id;
            renderBindingsUi();
          });
          row.append(label, btn);
          keyHost.appendChild(row);
        });
      }
      if (mouseHost) {
        mouseHost.replaceChildren();
        const mouseFields = [
          { id: 'leftClick', label: 'Left click' },
          { id: 'rightClick', label: 'Right click' },
          { id: 'middleClick', label: 'Middle click' },
          { id: 'doubleClick', label: 'Double click' },
          { id: 'wheel', label: 'Scroll wheel' },
          { id: 'drag', label: 'Drag on board' },
          { id: 'edgeClick', label: 'Click board edges' },
        ];
        mouseFields.forEach((field) => {
          const row = document.createElement('div');
          row.className = 'binding-row';
          const label = document.createElement('label');
          label.textContent = field.label;
          const select = document.createElement('select');
          const wheelExtras =
            field.id === 'wheel' || field.id === 'drag' || field.id === 'edgeClick'
              ? [{ id: 'move', label: 'Move L/R' }, ...ACTION_OPTIONS]
              : ACTION_OPTIONS;
          const options =
            field.id === 'wheel'
              ? [
                  { id: 'move', label: 'Move L/R' },
                  { id: 'down', label: 'Soft drop' },
                  { id: 'rotate', label: 'Rotate' },
                  { id: 'none', label: 'Do nothing' },
                ]
              : wheelExtras;
          options.forEach((opt) => {
            const o = document.createElement('option');
            o.value = opt.id;
            o.textContent = opt.label;
            if ((prefs.bindings.mouse[field.id] || '') === opt.id) o.selected = true;
            select.appendChild(o);
          });
          select.addEventListener('change', () => {
            prefs.bindings.mouse[field.id] = select.value;
            savePrefs(prefs);
            updateKeysHelp();
          });
          row.append(label, select);
          mouseHost.appendChild(row);
        });
      }
    }

    function renderBgPresets() {
      const host = root.querySelector('[data-bg-presets]');
      if (!host) return;
      host.replaceChildren();
      BG_PRESETS.forEach((preset) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bg-swatch' + (prefs.background.presetId === preset.id ? ' is-active' : '');
        btn.style.background = preset.css;
        btn.title = preset.label;
        const cap = document.createElement('span');
        cap.textContent = preset.label;
        btn.appendChild(cap);
        btn.addEventListener('click', () => {
          prefs.background = { mode: 'preset', presetId: preset.id, css: preset.css, image: '' };
          applyBackground(prefs.background, root);
          savePrefs(prefs);
          renderBgPresets();
          const cssField = root.querySelector('[data-bg-css]');
          if (cssField) cssField.value = preset.css;
        });
        host.appendChild(btn);
      });
      const cssField = root.querySelector('[data-bg-css]');
      const imgField = root.querySelector('[data-bg-image]');
      if (cssField && !cssField.dataset.bound) {
        cssField.dataset.bound = '1';
        cssField.value = prefs.background.css || '';
      }
      if (imgField && !imgField.dataset.bound) {
        imgField.dataset.bound = '1';
        imgField.value = prefs.background.image || '';
      }
    }

    function refillMusicSelect() {
      const select = root.querySelector('[data-music-track]');
      if (!select) return;
      const current = prefs.music.trackId;
      select.replaceChildren();
      MUSIC_TRACKS.forEach((track) => {
        const o = document.createElement('option');
        o.value = track.id;
        o.textContent = track.label;
        select.appendChild(o);
      });
      if (MUSIC_TRACKS.some((t) => t.id === current)) select.value = current;
      else {
        select.value = MUSIC_TRACKS[0].id;
        prefs.music.trackId = select.value;
      }
    }

    function renderMusicUi() {
      const select = root.querySelector('[data-music-track]');
      const credit = root.querySelector('[data-music-credit]');
      const custom = root.querySelector('[data-music-custom]');
      const volume = root.querySelector('[data-music-volume]');
      if (select && !select.dataset.bound) {
        select.dataset.bound = '1';
        select.addEventListener('change', () => {
          prefs.music.trackId = select.value;
          const meta = MUSIC_TRACKS.find((t) => t.id === select.value);
          if (credit) credit.textContent = meta ? meta.credit : '';
          savePrefs(prefs);
        });
      }
      refillMusicSelect();
      const meta = MUSIC_TRACKS.find((t) => t.id === prefs.music.trackId) || MUSIC_TRACKS[0];
      if (credit) credit.textContent = meta.credit;
      if (custom) {
        custom.value = prefs.music.customUrl || '';
        if (!custom.dataset.bound) {
          custom.dataset.bound = '1';
          custom.addEventListener('change', () => {
            prefs.music.customUrl = custom.value.trim();
            savePrefs(prefs);
          });
        }
      }
      if (volume) {
        volume.value = String(Math.round((prefs.music.volume || 0.35) * 100));
        if (!volume.dataset.bound) {
          volume.dataset.bound = '1';
          volume.addEventListener('input', () => {
            prefs.music.volume = Number(volume.value) / 100;
            music.setVolume(prefs.music.volume);
            savePrefs(prefs);
          });
        }
      }
    }

    function playSelectedMusic() {
      const track = MUSIC_TRACKS.find((t) => t.id === prefs.music.trackId) || MUSIC_TRACKS[0];
      music.setVolume(prefs.music.volume || 0.35);
      if (track.kind === 'off') music.stop();
      else if (track.kind === 'generated') music.playGenerated(track.style);
      else if (track.kind === 'url') music.playUrl(track.url || prefs.music.customUrl);
      else if (track.kind === 'custom') music.playUrl(prefs.music.customUrl);
    }

    function previewSelectedMusic() {
      const track = MUSIC_TRACKS.find((t) => t.id === prefs.music.trackId) || MUSIC_TRACKS[0];
      music.setVolume(prefs.music.volume || 0.35);
      if (track.kind === 'generated') music.previewGenerated(track.style, 2000);
      else if (track.kind === 'url' || track.kind === 'custom') {
        const url = track.url || prefs.music.customUrl;
        if (!url) {
          music.previewGenerated('chip', 1600);
          return;
        }
        music.playUrl(url);
        window.setTimeout(() => music.stop(), 2200);
      } else {
        music.previewGenerated('chip', 1200);
      }
      announce('Previewing sound');
    }

    function buildShareUrl() {
      const include = root.querySelector('[data-share-include-prefs]');
      const includePrefs = !include || include.checked;
      return `${cfg.shareUrl.replace(/#.*$/, '')}${encodeShareHash(prefs, includePrefs)}`;
    }

    function refreshShareUi() {
      const urlField = root.querySelector('[data-share-url]');
      const url = buildShareUrl();
      if (urlField) urlField.value = url;
      const text = encodeURIComponent('Play Git Blocks — a tiny tetris cabinet for shipping commits.');
      const x = root.querySelector('[data-share-x]');
      const li = root.querySelector('[data-share-linkedin]');
      if (x) x.href = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
      if (li) {
        li.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      }
    }

    function openCustomize(tab) {
      if (!panel) return;
      panel.hidden = false;
      if (game.status === 'playing') game.pause();
      renderBgPresets();
      renderMusicUi();
      renderBindingsUi();
      refreshShareUi();
      if (tab) switchTab(tab);
    }

    function closeCustomize() {
      if (!panel) return;
      panel.hidden = true;
      listeningAction = null;
      if (game.status === 'paused') game.resume();
      canvas.focus({ preventScroll: true });
    }

    function switchTab(id) {
      root.querySelectorAll('[data-tab]').forEach((btn) => {
        const on = btn.getAttribute('data-tab') === id;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      root.querySelectorAll('[data-pane]').forEach((pane) => {
        const on = pane.getAttribute('data-pane') === id;
        pane.hidden = !on;
        pane.classList.toggle('is-active', on);
      });
      if (id === 'share') refreshShareUi();
    }

    // Wire chrome
    root.querySelectorAll('[data-move]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        applyMove(btn.getAttribute('data-move'));
        canvas.focus({ preventScroll: true });
      });
    });
    if (playBtn) playBtn.addEventListener('click', handlePlay);
    if (pauseBtn) pauseBtn.addEventListener('click', handlePause);
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        muted = !muted;
        muteBtn.setAttribute('aria-pressed', String(muted));
        muteBtn.textContent = muted ? 'Sound off' : 'Sound on';
      });
    }
    if (customizeBtn) customizeBtn.addEventListener('click', () => openCustomize('look'));
    if (shareBtn) shareBtn.addEventListener('click', () => openCustomize('share'));
    root.querySelectorAll('[data-customize-close]').forEach((btn) => {
      btn.addEventListener('click', closeCustomize);
    });
    root.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    const bgApply = root.querySelector('[data-bg-apply]');
    const bgRandom = root.querySelector('[data-bg-random]');
    if (bgApply) {
      bgApply.addEventListener('click', () => {
        const css = (root.querySelector('[data-bg-css]') || {}).value || '';
        const image = ((root.querySelector('[data-bg-image]') || {}).value || '').trim();
        if (image) prefs.background = { mode: 'image', presetId: '', css, image };
        else prefs.background = { mode: 'css', presetId: '', css, image: '' };
        applyBackground(prefs.background, root);
        savePrefs(prefs);
        renderBgPresets();
        announce('Backdrop updated');
      });
    }
    if (bgRandom) {
      bgRandom.addEventListener('click', () => {
        const css = randomGradient();
        prefs.background = { mode: 'css', presetId: '', css, image: '' };
        const field = root.querySelector('[data-bg-css]');
        if (field) field.value = css;
        applyBackground(prefs.background, root);
        savePrefs(prefs);
        renderBgPresets();
      });
    }

    const musicApply = root.querySelector('[data-music-apply]');
    const musicStop = root.querySelector('[data-music-stop]');
    const musicPreview = root.querySelector('[data-music-preview]');
    const musicDiscover = root.querySelector('[data-music-discover]');
    if (musicApply) musicApply.addEventListener('click', playSelectedMusic);
    if (musicStop) musicStop.addEventListener('click', () => music.stop());
    if (musicPreview) musicPreview.addEventListener('click', previewSelectedMusic);
    if (musicDiscover) {
      musicDiscover.addEventListener('click', () => {
        discoverFreeTracks(5);
        prefs.music.trackId = (MUSIC_TRACKS.find((t) => t.discovered) || MUSIC_TRACKS[1] || MUSIC_TRACKS[0]).id;
        savePrefs(prefs);
        renderMusicUi();
        announce('Shuffled free open-source catalog');
      });
    }
    root.querySelectorAll('[data-sfx-preview]').forEach((btn) => {
      btn.addEventListener('click', () => {
        beep(btn.getAttribute('data-sfx-preview') || 'move');
      });
    });

    const bindingsReset = root.querySelector('[data-bindings-reset]');
    if (bindingsReset) {
      bindingsReset.addEventListener('click', () => {
        prefs.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
        savePrefs(prefs);
        renderBindingsUi();
        updateKeysHelp();
      });
    }

    const shareCopy = root.querySelector('[data-share-copy]');
    const shareNative = root.querySelector('[data-share-native]');
    const shareStatus = root.querySelector('[data-share-status]');
    const shareInclude = root.querySelector('[data-share-include-prefs]');
    if (shareInclude) shareInclude.addEventListener('change', refreshShareUi);
    if (shareCopy) {
      shareCopy.addEventListener('click', async () => {
        const url = buildShareUrl();
        refreshShareUi();
        try {
          await navigator.clipboard.writeText(url);
          if (shareStatus) shareStatus.textContent = 'Link copied.';
        } catch (_err) {
          if (shareStatus) shareStatus.textContent = 'Copy failed — select the field and copy manually.';
        }
      });
    }
    if (shareNative) {
      shareNative.addEventListener('click', async () => {
        const url = buildShareUrl();
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Git Blocks',
              text: 'Play Git Blocks — clear the backlog.',
              url,
            });
            if (shareStatus) shareStatus.textContent = 'Shared.';
          } catch (_err) {
            if (shareStatus) shareStatus.textContent = 'Share cancelled.';
          }
        } else if (shareStatus) {
          shareStatus.textContent = 'System share unavailable — use Copy link.';
        }
      });
    }

    canvas.addEventListener('keydown', onKey);
    window.addEventListener('keydown', onKey, { capture: true });
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    let touchStart = null;
    canvas.addEventListener(
      'touchstart',
      (event) => {
        const t = event.changedTouches[0];
        touchStart = { x: t.clientX, y: t.clientY, at: Date.now() };
      },
      { passive: true }
    );
    canvas.addEventListener(
      'touchend',
      (event) => {
        if (!touchStart) return;
        const t = event.changedTouches[0];
        const dx = t.clientX - touchStart.x;
        const dy = t.clientY - touchStart.y;
        const dt = Date.now() - touchStart.at;
        touchStart = null;
        if (game.status !== 'playing') {
          handlePlay();
          return;
        }
        if (Math.abs(dx) < 24 && Math.abs(dy) < 24 && dt < 250) applyMove('rotate');
        else if (Math.abs(dx) > Math.abs(dy)) applyMove(dx > 0 ? 'right' : 'left');
        else if (dy > 0) applyMove('down');
        else applyMove('drop');
      },
      { passive: true }
    );

    window.addEventListener('resize', draw);
    updateKeysHelp();
    renderMusicUi();
    startLoop();
    draw();

    if (cfg.autoStart && !autoStarted) {
      autoStarted = true;
      window.setTimeout(() => {
        if (game.status === 'ready') handlePlay();
        if (prefs.music.trackId && prefs.music.trackId !== 'off') playSelectedMusic();
      }, prefersReducedMotion() ? 200 : 700);
    }

    return game;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-git-blocks]').forEach((node) => boot(node));
    });
  }

  return {
    COLS,
    ROWS,
    SHAPES,
    META,
    CLEARS,
    KICKS,
    GRAVITY_TABLE_MS,
    BG_PRESETS,
    MUSIC_TRACKS,
    DEV_CLOUD_WORDS,
    DEFAULT_BINDINGS,
    gravityMs,
    lockDelayMs,
    discoverFreeTracks,
    rotate,
    collides,
    clearLines,
    scoreForClears,
    makePiece,
    createGame,
    boot,
  };
});
