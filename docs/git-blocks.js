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
    I: { label: "commit", color: "#5ec8d8", tip: "Long commit — clear four lines" },
    O: { label: "stash", color: "#e7c35a", tip: "Stash square — park it for later" },
    T: { label: "merge", color: "#8b7ce0", tip: "Merge T — spin into tight gaps" },
    S: { label: "star", color: "#3d8b6e", tip: "Star S — offset pair" },
    Z: { label: "hotfix", color: "#d45d5d", tip: "Hotfix Z — urgent zigzag" },
    J: { label: "branch", color: "#4f8fd4", tip: "Branch J — hook left" },
    L: { label: "review", color: "#e08a4a", tip: "Review L — hook right" },
  };
  const CLEARS = {
    1: { points: 100, message: "feat: land a clean commit", label: "commit" },
    2: { points: 300, message: "fix: unstick the merge", label: "fix" },
    3: { points: 500, message: "refactor: smaller pieces", label: "refactor" },
    4: { points: 800, message: "chore: ship the whole stack", label: "deploy" },
  };
  const SPRINT_NAMES = [
    "v0.1 scaffold",
    "alpha spike",
    "beta polish",
    "RC hardening",
    "GA launch",
    "hotfix train",
    "perf pass",
    "a11y sprint",
    "CI green week",
    "docs drive",
    "debt burn-down",
    "ship-it Friday",
    "on-call mode",
    "feature freeze",
    "postmortem",
    "scale-up",
    "edge-case hunt",
    "type-strict",
    "zero-bug",
    "legendary",
  ];
  const ACHIEVEMENTS = [
    { id: "first-commit", label: "First commit", test: (s) => s.lines >= 1 },
    { id: "ship-it", label: "Ship a deploy", test: (s) => s.deploys >= 1 },
    { id: "squash-king", label: "Squash merge", test: (s) => s.squashes >= 1 },
    { id: "combo-3", label: "Pipeline ×3", test: (s) => s.maxCombo >= 3 },
    { id: "green-ci", label: "Green CI", test: (s) => s.perfectClears >= 1 },
    { id: "cascade", label: "Cascade hero", test: (s) => s.maxChain >= 3 },
    { id: "sprint-5", label: "Sprint 5", test: (s) => s.level >= 5 },
    { id: "force-push", label: "Force push", test: (s) => s.forcePushes >= 1 },
  ];
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

  function boardIsEmpty(board) {
    return board.every((row) => row.every((cell) => cell == null));
  }

  function applyColumnGravity(board) {
    const next = emptyBoard();
    for (let x = 0; x < COLS; x += 1) {
      let write = ROWS - 1;
      for (let y = ROWS - 1; y >= 0; y -= 1) {
        if (board[y][x]) {
          next[write][x] = board[y][x];
          write -= 1;
        }
      }
    }
    return next;
  }

  function findSquashGroups(board, minSize) {
    const need = minSize || 4;
    const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const groups = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (!board[y][x] || visited[y][x]) continue;
        const kind = board[y][x];
        const cells = [];
        const stack = [[x, y]];
        visited[y][x] = true;
        while (stack.length) {
          const cur = stack.pop();
          const cx = cur[0];
          const cy = cur[1];
          cells.push({ x: cx, y: cy });
          const neighbors = [
            [cx + 1, cy],
            [cx - 1, cy],
            [cx, cy + 1],
            [cx, cy - 1],
          ];
          for (let i = 0; i < neighbors.length; i += 1) {
            const nx = neighbors[i][0];
            const ny = neighbors[i][1];
            if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
            if (visited[ny][nx] || board[ny][nx] !== kind) continue;
            visited[ny][nx] = true;
            stack.push([nx, ny]);
          }
        }
        if (cells.length >= need) groups.push({ kind, cells });
      }
    }
    return groups;
  }

  function resolveStep(board) {
    const mark = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const events = [];
    const deployRows = [];
    for (let y = 0; y < ROWS; y += 1) {
      if (board[y].every((cell) => cell != null)) {
        deployRows.push(y);
        for (let x = 0; x < COLS; x += 1) mark[y][x] = true;
      }
    }
    if (deployRows.length) events.push({ type: 'deploy', rows: deployRows.slice(), cells: deployRows.length * COLS });
    const groups = findSquashGroups(board, 4);
    groups.forEach((group) => {
      let fresh = 0;
      group.cells.forEach(({ x, y }) => {
        if (!mark[y][x]) {
          mark[y][x] = true;
          fresh += 1;
        }
      });
      if (fresh > 0) {
        events.push({ type: 'squash', kind: group.kind, cells: group.cells.slice(), count: group.cells.length });
      }
    });
    if (!events.length) return { board, events, changed: false, clearedCells: [] };
    const clearedCells = [];
    const stripped = board.map((row, y) =>
      row.map((cell, x) => {
        if (mark[y][x]) {
          clearedCells.push({ x, y, kind: cell });
          return null;
        }
        return cell;
      })
    );
    return {
      board: applyColumnGravity(stripped),
      events,
      changed: true,
      clearedCells,
    };
  }

  function resolveCascades(board) {
    let working = board.map((row) => row.slice());
    const waves = [];
    let chain = 0;
    while (chain < 24) {
      const step = resolveStep(working);
      if (!step.changed) break;
      chain += 1;
      waves.push({
        chain,
        events: step.events,
        clearedCells: step.clearedCells,
        board: step.board.map((row) => row.slice()),
      });
      working = step.board;
    }
    return { board: working, waves, chain };
  }

  function scoreForClears(cleared, level, combo, extras) {
    const extra = extras || {};
    const base = (CLEARS[cleared] || { points: 0 }).points;
    const comboBonus = cleared ? combo * 50 * level : 0;
    let total = base * level + comboBonus;
    if (extra.backToBack && cleared >= 4) total = Math.round(total * 1.5);
    if (extra.perfectClear) total += 1200 * level;
    return total;
  }

  function scoreForSquash(count, level, chain, combo) {
    return Math.round(count * 35 * level * (1 + (chain - 1) * 0.45) * (1 + combo * 0.15));
  }

  function sprintName(level) {
    const idx = Math.max(0, Math.min(SPRINT_NAMES.length - 1, (level || 1) - 1));
    return SPRINT_NAMES[idx];
  }

  function makeGarbageRow(random, kind) {
    const rnd = random || Math.random;
    const gap = Math.floor(rnd() * COLS);
    const fill = kind || 'Z';
    return Array.from({ length: COLS }, (_, x) => (x === gap ? null : fill));
  }

  // Gravity ramps each sprint — still familiar, but clears are cascade-based.
  const GRAVITY_TABLE_MS = [
    920, 800, 680, 560, 460, 380, 310, 255, 210, 175, 145, 120, 100, 85, 72, 60, 50, 42, 36, 30,
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

  function createGame(options) {
    const opts = options || {};
    const random = opts.random || Math.random;
    const now = opts.now || (() => Date.now());
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
      maxCombo: 0,
      maxChain: 0,
      deploys: 0,
      squashes: 0,
      perfectClears: 0,
      forcePushes: 0,
      debtCleared: 0,
      backToBack: false,
      backToBackCount: 0,
      achievements: {},
      commitLog: [],
      fx: [],
      status: 'ready',
      message: 'Sprint ready — stack commits, squash matches, ship deploys.',
      dropMs: gravityMs(1, Boolean(opts.reducedMotion)),
      lastTick: null,
      lockAt: 0,
      levelFlash: 0,
      reducedMotion: Boolean(opts.reducedMotion),
      cleanCharges: 1,
      pushCharges: 1,
    };

    function pushLog(entry) {
      state.commitLog.unshift(entry);
      if (state.commitLog.length > 8) state.commitLog.length = 8;
    }

    function unlockAchievements() {
      const unlocked = [];
      ACHIEVEMENTS.forEach((ach) => {
        if (state.achievements[ach.id]) return;
        if (ach.test(state)) {
          state.achievements[ach.id] = true;
          unlocked.push(ach);
          pushLog(`badge: ${ach.label}`);
        }
      });
      return unlocked;
    }

    function fillQueue() {
      while (state.queue.length < 5) {
        if (bag.length === 0) bag = shuffleBag(random);
        state.queue.push(bag.pop());
      }
    }

    function spawn(spawnOpts) {
      const so = spawnOpts || {};
      fillQueue();
      const kind = state.queue.shift();
      fillQueue();
      const piece = makePiece(kind);
      if (collides(state.board, piece)) {
        state.status = 'over';
        state.active = piece;
        state.message = 'Merge conflict — backlog hit production. Press R to rebase.';
        return false;
      }
      state.active = piece;
      if (!so.keepHoldUsed) state.holdUsed = false;
      state.lockAt = 0;
      return true;
    }

    function tryMove(dx, dy) {
      if (!state.active || state.status !== 'playing') return false;
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
      if (!state.active || state.status !== 'playing') return false;
      if (state.active.kind === 'O') {
        state.lockAt = 0;
        return true;
      }
      const rotated = rotate(state.active.matrix, dir);
      for (let i = 0; i < KICKS.length; i += 1) {
        const kx = KICKS[i][0];
        const ky = KICKS[i][1];
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

    function applyResolve(result) {
      if (!result.waves.length) {
        state.combo = 0;
        state.backToBack = false;
        return { sounds: ['lock'], badges: [] };
      }
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      state.maxChain = Math.max(state.maxChain, result.chain);
      const sounds = [];
      let deployRows = 0;
      let squashCells = 0;
      let difficult = false;
      result.waves.forEach((wave) => {
        state.fx.push({
          id: `wave-${now()}-${wave.chain}`,
          at: now(),
          chain: wave.chain,
          events: wave.events,
          cells: wave.clearedCells,
        });
        wave.events.forEach((ev) => {
          if (ev.type === 'deploy') {
            deployRows += ev.rows.length;
            state.deploys += 1;
            difficult = ev.rows.length >= 4 || difficult;
            sounds.push(ev.rows.length >= 4 ? 'deploy' : 'clear');
            pushLog((CLEARS[Math.min(4, ev.rows.length)] || CLEARS[1]).message);
          } else if (ev.type === 'squash') {
            squashCells += ev.count;
            state.squashes += 1;
            sounds.push('squash');
            const label = (META[ev.kind] && META[ev.kind].label) || 'commit';
            pushLog(`squash: ${label} ×${ev.count} (chain ${wave.chain})`);
          }
        });
        wave.events.forEach((ev) => {
          if (ev.type === 'deploy') {
            const n = Math.min(4, ev.rows.length);
            const b2b = state.backToBack && n >= 4;
            state.score += scoreForClears(n, state.level, state.combo, {
              backToBack: b2b,
            });
            if (b2b) state.backToBackCount += 1;
          } else if (ev.type === 'squash') {
            state.score += scoreForSquash(ev.count, state.level, wave.chain, state.combo);
          }
        });
      });
      state.lines += deployRows + Math.floor(squashCells / 4);
      if (boardIsEmpty(result.board)) {
        state.perfectClears += 1;
        state.score += 1200 * state.level;
        pushLog('ci: pipeline green — perfect clear');
        sounds.push('perfect');
        state.fx.push({ id: `ci-${now()}`, at: now(), type: 'ci-scan' });
      }
      state.backToBack = difficult;
      const nextLevel = 1 + Math.floor(state.lines / linesPerLevel());
      if (nextLevel > state.level) {
        state.level = nextLevel;
        state.dropMs = gravityMs(state.level, state.reducedMotion);
        state.levelFlash = now();
        state.cleanCharges = Math.min(2, state.cleanCharges + 1);
        state.pushCharges = Math.min(2, state.pushCharges + 1);
        state.message = `Sprint ${state.level}: ${sprintName(state.level)}`;
        pushLog(`sprint → ${sprintName(state.level)}`);
        sounds.push('level');
        // inject light tech-debt at higher sprints
        if (state.level >= 3 && random() < 0.55) {
          state.board = result.board;
          injectDebt(1);
          result.board = state.board;
          pushLog('debt: tech debt floated up from staging');
        }
      } else if (deployRows) {
        state.message = (CLEARS[Math.min(4, deployRows)] || CLEARS[1]).message;
      } else {
        state.message = `Squash cascade ×${result.chain}`;
      }
      state.dropMs = gravityMs(state.level, state.reducedMotion);
      const badges = unlockAchievements();
      if (badges.length) sounds.push('badge');
      return { sounds, badges };
    }

    function injectDebt(rows) {
      const n = rows || 1;
      for (let i = 0; i < n; i += 1) {
        // shift up — lose top if overflow
        for (let y = 0; y < ROWS - 1; y += 1) {
          state.board[y] = state.board[y + 1].slice();
        }
        state.board[ROWS - 1] = makeGarbageRow(random, 'Z');
      }
    }

    function lockPiece() {
      if (!state.active) return { sounds: [] };
      pieceCells(state.active).forEach(({ x, y }) => {
        if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
          state.board[y][x] = state.active.kind;
        }
      });
      state.active = null;
      const result = resolveCascades(state.board);
      state.board = result.board;
      const outcome = applyResolve(result);
      spawn();
      return outcome;
    }

    function hardDrop() {
      if (!state.active || state.status !== 'playing') return 0;
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
      if (!state.active || state.holdUsed || state.status !== 'playing') return false;
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
      state.message = 'Stashed on the shelf.';
      return true;
    }

    function gitClean() {
      if (state.status !== 'playing' || state.cleanCharges < 1) return false;
      // remove bottom-most garbage-ish incomplete row with most fills
      let bestY = -1;
      let bestFill = 0;
      for (let y = ROWS - 1; y >= 0; y -= 1) {
        const fill = state.board[y].filter(Boolean).length;
        if (fill > 0 && fill < COLS && fill >= bestFill) {
          bestFill = fill;
          bestY = y;
        }
      }
      if (bestY < 0) return false;
      state.board[bestY] = Array(COLS).fill(null);
      state.board = applyColumnGravity(state.board);
      state.cleanCharges -= 1;
      state.debtCleared += bestFill;
      state.score += 40 * state.level;
      pushLog('git clean — swept a messy row');
      state.message = 'git clean — working tree tidied.';
      state.fx.push({ id: `clean-${now()}`, at: now(), type: 'clean', y: bestY });
      unlockAchievements();
      return true;
    }

    function forcePush() {
      if (state.status !== 'playing' || state.pushCharges < 1) return false;
      // clear the fullest incomplete row as a panic deploy
      let bestY = -1;
      let bestFill = 0;
      for (let y = 0; y < ROWS; y += 1) {
        const fill = state.board[y].filter(Boolean).length;
        if (fill > 0 && fill < COLS && fill > bestFill) {
          bestFill = fill;
          bestY = y;
        }
      }
      if (bestY < 0) return false;
      state.board[bestY] = Array(COLS).fill(null);
      state.board = applyColumnGravity(state.board);
      const result = resolveCascades(state.board);
      state.board = result.board;
      state.pushCharges -= 1;
      state.forcePushes += 1;
      state.score += 90 * state.level;
      pushLog('force-push — rewrote history (carefully)');
      applyResolve(result);
      state.message = 'force-push — history rewritten.';
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
      if (state.status !== 'playing' || !state.active) return;
      if (state.lastTick == null) state.lastTick = ts;
      if (ts - state.lastTick < state.dropMs) return;
      state.lastTick = ts;
      if (!tryMove(0, 1)) {
        if (!state.lockAt) state.lockAt = ts;
        if (ts - state.lockAt >= lockDelayMs(state.level)) lockPiece();
      }
    }

    function play() {
      if (state.status === 'playing') return;
      if (state.status === 'over') reset();
      state.status = 'playing';
      state.message = `Sprint ${state.level}: ${sprintName(state.level)} — match 4+ or fill a row.`;
      state.lastTick = now();
      state.levelFlash = now();
      if (!state.active) spawn();
    }

    function pause() {
      if (state.status !== 'playing') return;
      state.status = 'paused';
      state.message = 'Working tree paused.';
    }

    function resume() {
      if (state.status !== 'paused') return;
      state.status = 'playing';
      state.lastTick = now();
      state.message = 'Back on the main branch.';
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
      state.maxCombo = 0;
      state.maxChain = 0;
      state.deploys = 0;
      state.squashes = 0;
      state.perfectClears = 0;
      state.forcePushes = 0;
      state.debtCleared = 0;
      state.backToBack = false;
      state.backToBackCount = 0;
      state.achievements = {};
      state.commitLog = [];
      state.fx = [];
      state.status = 'ready';
      state.message = 'Sprint ready — stack commits, squash matches, ship deploys.';
      state.dropMs = gravityMs(1, state.reducedMotion);
      state.lastTick = null;
      state.lockAt = 0;
      state.levelFlash = 0;
      state.cleanCharges = 1;
      state.pushCharges = 1;
      bag = [];
      fillQueue();
    }

    function consumeFx() {
      const fresh = state.fx.slice();
      state.fx = [];
      return fresh;
    }

    function snapshot() {
      return {
        board: state.board.map((row) => row.slice()),
        active: state.active
          ? { ...state.active, matrix: cloneMatrix(state.active.matrix) }
          : null,
        ghost: ghost(),
        hold: state.hold,
        queue: state.queue.slice(0, 4),
        score: state.score,
        lines: state.lines,
        level: state.level,
        combo: state.combo,
        maxCombo: state.maxCombo,
        maxChain: state.maxChain,
        deploys: state.deploys,
        squashes: state.squashes,
        sprint: sprintName(state.level),
        cleanCharges: state.cleanCharges,
        pushCharges: state.pushCharges,
        commitLog: state.commitLog.slice(),
        achievements: Object.keys(state.achievements),
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
      gitClean,
      forcePush,
      consumeFx,
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

  /**
   * WordGenerator — random letter clusters + Dev-related tokens for floating clouds.
   */
  const WordGenerator = (function createWordGenerator() {
    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const LOWER = 'abcdefghijklmnopqrstuvwxyz';
    const DIGITS = '0123456789';
    const LANGS = ['css', 'php', 'wordpress', 'react', 'general'];
    const PREFIXES = ['git', 'npm', 'wp', 'css', 'js', 'ts', 'api', 'ci', 'dev', 'web', 'db', 'ux'];
    const SUFFIXES = ['fix', 'ship', 'merge', 'build', 'lint', 'test', 'hook', 'sync', 'diff', 'push', 'pull', 'pack'];

    function pick(list, random) {
      const rnd = random || Math.random;
      return list[Math.floor(rnd() * list.length)];
    }

    function randomLetters(len, random) {
      const rnd = random || Math.random;
      const n = Math.max(1, Math.min(12, len || 2 + Math.floor(rnd() * 4)));
      let out = '';
      for (let i = 0; i < n; i += 1) {
        const pool = i === 0 ? LETTERS : rnd() > 0.35 ? LOWER : LETTERS;
        out += pool[Math.floor(rnd() * pool.length)];
      }
      return out;
    }

    function randomHexToken(random) {
      const rnd = random || Math.random;
      const n = 3 + Math.floor(rnd() * 4);
      let out = '#';
      for (let i = 0; i < n; i += 1) out += '0123456789abcdef'[Math.floor(rnd() * 16)];
      return out;
    }

    function randomDevCompound(random) {
      const rnd = random || Math.random;
      return `${pick(PREFIXES, rnd)}-${pick(SUFFIXES, rnd)}`;
    }

    function randomDevWord(random) {
      const rnd = random || Math.random;
      const lang = pick(LANGS, rnd);
      const pool = DEV_CLOUD_WORDS[lang] || DEV_CLOUD_WORDS.general;
      return { text: pick(pool, rnd), lang: lang === 'wordpress' ? 'wp' : lang === 'general' ? 'dev' : lang };
    }

    function nextCloudToken(random) {
      const rnd = random || Math.random;
      const roll = rnd();
      if (roll < 0.28) {
        return { text: randomLetters(2 + Math.floor(rnd() * 5), rnd), lang: 'dev' };
      }
      if (roll < 0.4) {
        return { text: randomHexToken(rnd), lang: 'css' };
      }
      if (roll < 0.52) {
        return { text: randomDevCompound(rnd), lang: 'dev' };
      }
      if (roll < 0.6) {
        const a = LETTERS[Math.floor(rnd() * 26)];
        const b = DIGITS[Math.floor(rnd() * 10)];
        return { text: `${a}${b}${randomLetters(2, rnd)}`, lang: 'dev' };
      }
      return randomDevWord(rnd);
    }

    function generateCloud(count, random) {
      const rnd = random || Math.random;
      const n = Math.max(8, count || 22);
      const tokens = [];
      for (let i = 0; i < n; i += 1) tokens.push(nextCloudToken(rnd));
      return tokens;
    }

    return {
      LETTERS,
      randomLetters,
      randomHexToken,
      randomDevCompound,
      randomDevWord,
      nextCloudToken,
      generateCloud,
    };
  })();

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

  function drawCell(ctx, x, y, size, color, ghost, pulse) {
    const pad = Math.max(1, Math.floor(size * 0.08));
    const glow = pulse ? 0.35 + pulse * 0.45 : 0;
    ctx.save();
    if (!ghost && glow > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = size * (0.35 + glow);
    }
    ctx.globalAlpha = ghost ? 0.28 : 1;
    roundedRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, size * 0.18);
    ctx.fillStyle = color;
    ctx.fill();
    if (!ghost) {
      ctx.shadowBlur = 0;
      const g = ctx.createLinearGradient(x, y, x, y + size);
      g.addColorStop(0, 'rgba(255,255,255,0.28)');
      g.addColorStop(0.45, 'rgba(255,255,255,0.06)');
      g.addColorStop(1, 'rgba(0,0,0,0.22)');
      ctx.fillStyle = g;
      roundedRect(ctx, x + pad, y + pad, size - pad * 2, size - pad * 2, size * 0.18);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
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

  function createSfxEngine() {
    let audioCtx = null;
    function ctx() {
      if (typeof AudioContext === 'undefined') return null;
      audioCtx = audioCtx || new AudioContext();
      return audioCtx;
    }
    function tone(freq, dur, type, gainVal, slide) {
      const ac = ctx();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const t = ac.currentTime;
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      gain.gain.setValueAtTime(gainVal || 0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
    function noiseBurst(dur, gainVal) {
      const ac = ctx();
      if (!ac) return;
      const len = Math.floor(ac.sampleRate * dur);
      const buffer = ac.createBuffer(1, len, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource();
      const gain = ac.createGain();
      const filter = ac.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      src.buffer = buffer;
      gain.gain.setValueAtTime(gainVal || 0.04, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      src.start();
    }
    function play(kind) {
      try {
        if (kind === 'move') tone(420, 0.06, 'square', 0.03);
        else if (kind === 'rotate') {
          tone(560, 0.07, 'triangle', 0.04);
          tone(720, 0.08, 'triangle', 0.025, 900);
        } else if (kind === 'drop' || kind === 'lock') {
          tone(180, 0.1, 'sawtooth', 0.04, 90);
          noiseBurst(0.08, 0.03);
        } else if (kind === 'clear') {
          tone(520, 0.1, 'triangle', 0.05);
          tone(780, 0.14, 'triangle', 0.04, 980);
        } else if (kind === 'squash') {
          tone(360, 0.09, 'square', 0.045, 280);
          tone(640, 0.12, 'triangle', 0.04);
          noiseBurst(0.1, 0.035);
        } else if (kind === 'deploy') {
          [523, 659, 784, 1046].forEach((f, i) => {
            setTimeout(() => tone(f, 0.16, 'triangle', 0.05), i * 70);
          });
          noiseBurst(0.18, 0.04);
        } else if (kind === 'perfect') {
          [523, 659, 784, 988, 1174].forEach((f, i) => {
            setTimeout(() => tone(f, 0.18, 'sine', 0.045), i * 55);
          });
        } else if (kind === 'level') {
          tone(440, 0.12, 'square', 0.04);
          setTimeout(() => tone(660, 0.16, 'square', 0.045), 90);
          setTimeout(() => tone(880, 0.2, 'triangle', 0.05), 180);
        } else if (kind === 'badge') {
          tone(880, 0.1, 'sine', 0.04);
          setTimeout(() => tone(1320, 0.14, 'sine', 0.035), 80);
        } else if (kind === 'start') {
          tone(392, 0.1, 'triangle', 0.04);
          setTimeout(() => tone(523, 0.14, 'triangle', 0.045), 90);
        } else if (kind === 'clean') {
          tone(700, 0.1, 'sine', 0.035, 1100);
          noiseBurst(0.12, 0.03);
        } else tone(440, 0.08, 'square', 0.03);
      } catch (_err) {
        /* ignore */
      }
    }
    return { play, ctx };
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
    const tokens = WordGenerator.generateCloud(24);
    host.className = `dev-clouds pattern-${pattern || 'drift'}`;
    host.replaceChildren();
    tokens.forEach((token) => {
      const span = document.createElement('span');
      span.className = 'dev-cloud';
      span.textContent = token.text;
      span.style.left = `${4 + Math.random() * 90}%`;
      span.style.top = `${6 + Math.random() * 84}%`;
      span.style.animationDelay = `${(-Math.random() * 18).toFixed(2)}s`;
      span.style.animationDuration = `${14 + Math.random() * 18}s`;
      span.style.fontSize = `${0.7 + Math.random() * 0.85}rem`;
      span.style.opacity = String(0.18 + Math.random() * 0.35);
      span.dataset.lang = token.lang || 'dev';
      host.appendChild(span);
    });
  }

  function refreshDevCloudText(doc) {
    const rootDoc = doc || (typeof document !== 'undefined' ? document : null);
    if (!rootDoc) return;
    rootDoc.querySelectorAll('[data-dev-clouds] .dev-cloud').forEach((el) => {
      const token = WordGenerator.nextCloudToken();
      el.textContent = token.text;
      el.dataset.lang = token.lang || 'dev';
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
    const sfx = createSfxEngine();
    let muted = false;
    let raf = 0;
    let lastLevelShown = 1;
    let autoStarted = false;
    let listeningAction = null;
    let wheelAcc = 0;
    let dragState = null;
    let lastClickAt = 0;
    const particles = [];
    let shakeUntil = 0;
    let ciScan = null;
    let flashCells = [];

    applyBackground(prefs.background, root);
    music.setVolume(prefs.music.volume || 0.35);

    if (!prefersReducedMotion()) {
      window.setInterval(() => {
        refreshDevCloudText(root.ownerDocument);
      }, 4200);
    }

    function beep(kind) {
      if (muted) return;
      sfx.play(kind);
    }

    function spawnParticles(cells, cellSize) {
      if (prefersReducedMotion()) return;
      cells.forEach((cell) => {
        const color = (META[cell.kind] && META[cell.kind].color) || '#8ec8ff';
        for (let i = 0; i < 5; i += 1) {
          particles.push({
            x: (cell.x + 0.5) * cellSize,
            y: (cell.y + 0.5) * cellSize,
            vx: (Math.random() - 0.5) * 4.5,
            vy: (Math.random() - 0.8) * 5.5,
            life: 1,
            color,
            size: 2 + Math.random() * 3,
          });
        }
      });
    }

    function ingestFx(fxList, cellSize) {
      fxList.forEach((fx) => {
        if (fx.cells && fx.cells.length) {
          spawnParticles(fx.cells, cellSize);
          flashCells = fx.cells.map((c) => ({ ...c, until: Date.now() + 280 }));
          shakeUntil = Date.now() + 160;
        }
        if (fx.type === 'ci-scan' || (fx.events && fx.events.some((e) => e.type === 'deploy'))) {
          ciScan = { y: 0, until: Date.now() + 700 };
        }
        if (fx.events) {
          fx.events.forEach((ev) => {
            if (ev.type === 'deploy' && ev.rows && ev.rows.length >= 4) shakeUntil = Date.now() + 280;
          });
        }
      });
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
      const fx = typeof game.consumeFx === 'function' ? game.consumeFx() : [];
      if (fx.length) {
        ingestFx(fx, cell);
        fx.forEach((item) => {
          if (item.type === 'ci-scan') beep('perfect');
          if (item.type === 'clean') beep('clean');
          (item.events || []).forEach((ev) => {
            if (ev.type === 'deploy') beep(ev.rows && ev.rows.length >= 4 ? 'deploy' : 'clear');
            if (ev.type === 'squash') beep('squash');
          });
          if (item.chain >= 3) beep('level');
        });
      }

      const snap = game.snapshot();
      const shaking = Date.now() < shakeUntil && !prefersReducedMotion();
      ctx.save();
      if (shaking) {
        ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 4);
      }

      // atmospheric board backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, ROWS * cell);
      bg.addColorStop(0, '#0a1528');
      bg.addColorStop(1, '#07111f');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, COLS * cell, ROWS * cell);

      ctx.strokeStyle = 'rgba(207,217,230,0.07)';
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

      const nowTs = Date.now();
      flashCells = flashCells.filter((c) => c.until > nowTs);
      const flashMap = {};
      flashCells.forEach((c) => {
        flashMap[`${c.x},${c.y}`] = (c.until - nowTs) / 280;
      });

      snap.board.forEach((row, y) => {
        row.forEach((kind, x) => {
          if (!kind) return;
          const pulse = flashMap[`${x},${y}`] || 0;
          drawCell(ctx, x * cell, y * cell, cell, META[kind].color, false, pulse);
        });
      });
      if (snap.ghost && snap.active) {
        pieceCells(snap.ghost).forEach(({ x, y }) => {
          if (y >= 0) drawCell(ctx, x * cell, y * cell, cell, META[snap.active.kind].color, true, 0);
        });
      }
      if (snap.active) {
        pieceCells(snap.active).forEach(({ x, y }) => {
          if (y >= 0) drawCell(ctx, x * cell, y * cell, cell, META[snap.active.kind].color, false, 0.15);
        });
      }

      // CI scan sweep
      if (ciScan && nowTs < ciScan.until && !prefersReducedMotion()) {
        const t = 1 - (ciScan.until - nowTs) / 700;
        const y = t * ROWS * cell;
        const grad = ctx.createLinearGradient(0, y - 18, 0, y + 18);
        grad.addColorStop(0, 'rgba(94,200,216,0)');
        grad.addColorStop(0.5, 'rgba(94,200,216,0.45)');
        grad.addColorStop(1, 'rgba(94,200,216,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, y - 18, COLS * cell, 36);
      } else {
        ciScan = null;
      }

      // particles
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 0.03;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();

      if (scoreEl) scoreEl.textContent = String(snap.score);
      if (linesEl) linesEl.textContent = String(snap.lines);
      if (levelEl) levelEl.textContent = String(snap.level);
      if (highEl) highEl.textContent = String(Math.max(high, snap.score));
      if (messageEl) messageEl.textContent = snap.message;
      const comboEl = root.querySelector('[data-combo]');
      const deployEl = root.querySelector('[data-deploys]');
      const squashEl = root.querySelector('[data-squashes]');
      const sprintEl = root.querySelector('[data-sprint]');
      if (comboEl) comboEl.textContent = String(snap.combo);
      if (deployEl) deployEl.textContent = String(snap.deploys);
      if (squashEl) squashEl.textContent = String(snap.squashes);
      if (sprintEl) sprintEl.textContent = snap.sprint || '';
      const cleanBtn = root.querySelector('[data-git-clean]');
      const pushBtn = root.querySelector('[data-force-push]');
      if (cleanBtn) {
        cleanBtn.disabled = snap.status !== 'playing' || snap.cleanCharges < 1;
        cleanBtn.textContent = `git clean (${snap.cleanCharges})`;
      }
      if (pushBtn) {
        pushBtn.disabled = snap.status !== 'playing' || snap.pushCharges < 1;
        pushBtn.textContent = `force-push (${snap.pushCharges})`;
      }
      const logEl = root.querySelector('[data-commit-log]');
      if (logEl) {
        logEl.replaceChildren();
        (snap.commitLog || []).slice(0, 5).forEach((line) => {
          const li = document.createElement('li');
          li.textContent = line;
          logEl.appendChild(li);
        });
      }
      const badgeEl = root.querySelector('[data-badges]');
      if (badgeEl) {
        badgeEl.replaceChildren();
        (snap.achievements || []).forEach((id) => {
          const ach = ACHIEVEMENTS.find((a) => a.id === id);
          const span = document.createElement('span');
          span.className = 'badge-chip';
          span.textContent = ach ? ach.label : id;
          badgeEl.appendChild(span);
        });
      }
      paintMini(holdEl, [snap.hold]);
      paintMini(nextEl, snap.queue);

      const flashAge = snap.levelFlash ? Date.now() - snap.levelFlash : 9999;
      const showLevelBanner = snap.status === 'playing' && flashAge < 900;
      const customizing = panel && !panel.hidden;
      if (overlay && overlayTitle && overlayBody) {
        const show = !customizing && (snap.status !== 'playing' || showLevelBanner);
        overlay.hidden = !show;
        overlay.classList.toggle('is-clickable', !customizing && snap.status !== 'playing');
        if (overlayLevel) {
          overlayLevel.hidden = !(showLevelBanner || snap.status === 'ready');
          overlayLevel.textContent = snap.sprint || `Sprint ${snap.level}`;
        }
        if (showLevelBanner && snap.status === 'playing') {
          overlayTitle.textContent = 'New sprint';
          overlayBody.textContent = `${snap.sprint}. Gravity rises — keep matching clusters of 4+ or fill rows to deploy.`;
          if (playBtn) playBtn.hidden = true;
        } else if (snap.status === 'ready') {
          overlayTitle.textContent = 'Git Blocks';
          overlayBody.textContent =
            'Not Tetris — stack commits, squash 4+ matching clusters, fill rows to deploy. Cascades chain for big scores.';
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = 'Start sprint';
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
          overlayBody.textContent = `Score ${snap.score} · ${snap.deploys} deploys · ${snap.squashes} squashes. Rebase to try again.`;
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = 'Rebase';
          }
        }
      }
      if (snap.level !== lastLevelShown && snap.status === 'playing') {
        lastLevelShown = snap.level;
        announce(`Sprint ${snap.level}: ${snap.sprint}`);
        beep('level');
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
        if (!game.softDrop()) beep('lock');
      }
      if (move === 'rotate' && game.tryRotate(1)) beep('rotate');
      if (move === 'rotate-ccw' && game.tryRotate(-1)) beep('rotate');
      if (move === 'drop') {
        game.hardDrop();
        beep('lock');
      }
      if (move === 'hold') game.hold();
      if (move === 'clean' && game.gitClean && game.gitClean()) beep('clean');
      if (move === 'push' && game.forcePush && game.forcePush()) beep('deploy');
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
      if (panel && !panel.hidden) {
        if (event.key === 'Escape') {
          closeCustomize();
        }
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
      panel.removeAttribute('hidden');
      root.classList.add('is-customizing');
      if (overlay) {
        overlay.hidden = true;
        overlay.classList.remove('is-clickable');
      }
      if (game.status === 'playing') game.pause();
      renderBgPresets();
      renderMusicUi();
      renderBindingsUi();
      refreshShareUi();
      if (tab) switchTab(tab);
      const firstTab = panel.querySelector(`[data-tab="${tab || 'look'}"]`);
      if (firstTab && typeof firstTab.focus === 'function') firstTab.focus({ preventScroll: true });
    }

    function closeCustomize() {
      if (!panel) return;
      panel.hidden = true;
      panel.setAttribute('hidden', '');
      root.classList.remove('is-customizing');
      listeningAction = null;
      if (game.status === 'paused') game.resume();
      draw();
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
    const cleanBtnWire = root.querySelector('[data-git-clean]');
    const pushBtnWire = root.querySelector('[data-force-push]');
    if (cleanBtnWire) cleanBtnWire.addEventListener('click', () => applyMove('clean'));
    if (pushBtnWire) pushBtnWire.addEventListener('click', () => applyMove('push'));

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
    WordGenerator,
    DEFAULT_BINDINGS,
    gravityMs,
    lockDelayMs,
    discoverFreeTracks,
    rotate,
    collides,
    clearLines,
    findSquashGroups,
    resolveCascades,
    applyColumnGravity,
    scoreForClears,
    scoreForSquash,
    sprintName,
    ACHIEVEMENTS,
    makePiece,
    createGame,
    createSfxEngine,
    boot,
  };
});
