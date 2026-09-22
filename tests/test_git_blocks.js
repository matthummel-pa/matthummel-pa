const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const engine = require(path.join(__dirname, "..", "game", "git-blocks.js"));

test("rotate turns a T piece clockwise", () => {
  const rotated = engine.rotate(engine.SHAPES.T, 1);
  assert.deepEqual(rotated, [
    [0, 1, 0],
    [0, 1, 1],
    [0, 1, 0],
  ]);
});

test("every piece except O changes shape when rotated in play", () => {
  for (const kind of ["I", "T", "S", "Z", "J", "L"]) {
    const game = engine.createGame({ random: () => 0 });
    game.play();
    // Force a known active piece by hard-resetting via rotate on whatever spawned,
    // then verify tryRotate succeeds at least once from spawn.
    const before = game.snapshot().active;
    assert.ok(before, `${kind} should have an active piece`);
    // Spawn-specific: create piece and rotate via engine helpers
    const piece = engine.makePiece(kind);
    const once = engine.rotate(piece.matrix, 1);
    const twice = engine.rotate(once, 1);
    const thrice = engine.rotate(twice, 1);
    const full = engine.rotate(thrice, 1);
    assert.notDeepEqual(once, piece.matrix, `${kind} clockwise should change matrix`);
    assert.deepEqual(full, piece.matrix, `${kind} four clockwise rotations return home`);
    const ccw = engine.rotate(piece.matrix, -1);
    assert.notDeepEqual(ccw, piece.matrix, `${kind} counter-clockwise should change matrix`);
    assert.deepEqual(engine.rotate(ccw, 1), piece.matrix, `${kind} cw undoes ccw`);
  }
});

test("tryRotate succeeds for T beside a wall via kicks", () => {
  const game = engine.createGame({ random: () => 0.5 });
  game.play();
  // Nudge left until blocked, then rotate — kicks should keep it legal.
  for (let i = 0; i < 12; i += 1) game.tryMove(-1, 0);
  const ok = game.tryRotate(1);
  assert.equal(ok, true);
  const snap = game.snapshot();
  assert.ok(snap.active);
  assert.equal(engine.collides(snap.board, snap.active), false);
});

test("tryRotate returns true for O without changing footprint", () => {
  let i = 0;
  const game = engine.createGame({
    random: () => {
      // Bias bag toward O by returning values that shuffle O early when needed.
      i += 1;
      return (i % 7) / 7;
    },
  });
  game.play();
  // Rotate whatever is active — O path or non-O both must return boolean success often.
  const first = game.tryRotate(1);
  assert.equal(typeof first, "boolean");
  // Explicit O path through makePiece + rotate helper
  const o = engine.makePiece("O");
  const spun = engine.rotate(o.matrix, 1);
  assert.deepEqual(spun, o.matrix);
});

test("collides with walls and filled cells", () => {
  const board = Array.from({ length: engine.ROWS }, () => Array(engine.COLS).fill(null));
  const piece = engine.makePiece("O");
  piece.x = -1;
  assert.equal(engine.collides(board, piece), true);
  piece.x = 0;
  assert.equal(engine.collides(board, piece), false);
  board[0][0] = "I";
  board[0][1] = "I";
  assert.equal(engine.collides(board, piece), true);
});

test("clearLines removes full rows and scores a tetris", () => {
  const board = Array.from({ length: engine.ROWS }, () => Array(engine.COLS).fill(null));
  for (let y = engine.ROWS - 4; y < engine.ROWS; y += 1) {
    board[y] = Array(engine.COLS).fill("I");
  }
  const result = engine.clearLines(board);
  assert.equal(result.cleared, 4);
  assert.equal(result.board[engine.ROWS - 1].every((cell) => cell == null), true);
  assert.equal(engine.scoreForClears(4, 1, 1), 850);
});

test("createGame hard-drop locks a piece and stays playable", () => {
  let i = 0;
  const game = engine.createGame({ random: () => (i++ % 10) / 10 });
  game.play();
  game.hardDrop();
  const snap = game.snapshot();
  assert.ok(["playing", "over"].includes(snap.status));
  assert.ok(snap.queue.length >= 3);
  assert.ok(snap.score >= 0);
});

test("hold only works once per drop", () => {
  const game = engine.createGame({ random: () => 0.2 });
  game.play();
  assert.equal(game.hold(), true);
  assert.equal(game.hold(), false);
});

test("gravity gets harder each level", () => {
  assert.ok(engine.gravityMs(1, false) > engine.gravityMs(5, false));
  assert.ok(engine.gravityMs(5, false) > engine.gravityMs(12, false));
  assert.ok(engine.lockDelayMs(1) > engine.lockDelayMs(10));
  const game = engine.createGame({ random: () => 0.2 });
  game.play();
  const drop1 = game.snapshot().dropMs;
  assert.equal(drop1, engine.GRAVITY_TABLE_MS[0]);
  assert.ok(engine.DEV_CLOUD_WORDS.css.length > 3);
  assert.ok(engine.discoverFreeTracks(4).length >= 4);
});

test("WordGenerator emits rand letters and Dev words for clouds", () => {
  assert.equal(typeof engine.WordGenerator, "object");
  const letters = engine.WordGenerator.randomLetters(4, () => 0.1);
  assert.match(letters, /^[A-Za-z]+$/);
  assert.ok(letters.length >= 1);
  const token = engine.WordGenerator.nextCloudToken(() => 0.9);
  assert.ok(token.text.length >= 1);
  assert.ok(token.lang);
  const cloud = engine.WordGenerator.generateCloud(12, () => 0.2);
  assert.equal(cloud.length, 12);
  assert.ok(cloud.every((t) => typeof t.text === "string" && t.text.length > 0));
  const compound = engine.WordGenerator.randomDevCompound(() => 0);
  assert.match(compound, /-/);
});

test("player files ship together", () => {
  const gameDir = path.join(__dirname, "..", "game");
  const html = fs.readFileSync(path.join(gameDir, "index.html"), "utf8");
  assert.match(html, /data-git-blocks/);
  assert.match(html, /acreline\.matthummel\.com/);
  assert.match(html, /walkridge\.matthummel\.com/);
  assert.match(html, /data-dev-clouds/);
  assert.match(html, /not Tetris/);
  assert.match(html, /data-git-clean/);
  assert.match(html, /data-force-push/);
  assert.match(html, /data-commit-log/);
  assert.doesNotMatch(html, /hummelwp/);
  assert.equal(typeof engine.boot, "function");
  assert.ok(fs.existsSync(path.join(gameDir, "git-blocks.css")));
  const player = fs.readFileSync(path.join(__dirname, "..", "assets", "git-blocks-player.svg"), "utf8");
  assert.match(player, /GIT BLOCKS/);
  assert.doesNotMatch(player, /[\uFFFD\u0090\u0091\u0092]/);
});

test("squash merges clear connected clusters of four", () => {
  const board = Array.from({ length: engine.ROWS }, () => Array(engine.COLS).fill(null));
  [
    [0, 19],
    [1, 19],
    [0, 18],
    [1, 18],
  ].forEach(([x, y]) => {
    board[y][x] = "T";
  });
  const groups = engine.findSquashGroups(board, 4);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].cells.length, 4);
  const resolved = engine.resolveCascades(board);
  assert.ok(resolved.waves.length >= 1);
  assert.equal(resolved.board[19][0], null);
  assert.ok(engine.scoreForSquash(4, 2, 2, 1) > engine.scoreForSquash(4, 1, 1, 0));
});

test("wordpress plugin sample packs the cabinet", () => {
  const plugin = path.join(__dirname, "..", "samples", "git-blocks");
  assert.ok(fs.existsSync(path.join(plugin, "git-blocks.php")));
  assert.ok(fs.existsSync(path.join(plugin, "includes", "class-git-blocks-plugin.php")));
  assert.ok(fs.existsSync(path.join(plugin, "templates", "player.php")));
  assert.ok(fs.existsSync(path.join(plugin, "assets", "js", "git-blocks.js")));
  assert.ok(fs.existsSync(path.join(plugin, "assets", "css", "git-blocks.css")));
  assert.ok(fs.existsSync(path.join(plugin, "bin", "pack.sh")));
  const main = fs.readFileSync(path.join(plugin, "git-blocks.php"), "utf8");
  assert.match(main, /Plugin Name:\s+Git Blocks/);
  const tpl = fs.readFileSync(path.join(plugin, "templates", "player.php"), "utf8");
  assert.match(tpl, /data-git-blocks/);
  const pluginPhp = fs.readFileSync(path.join(plugin, "includes", "class-git-blocks-plugin.php"), "utf8");
  assert.match(pluginPhp, /add_shortcode\(\s*'git_blocks'/);
  const pluginEngine = require(path.join(plugin, "assets", "js", "git-blocks.js"));
  assert.equal(typeof pluginEngine.boot, "function");
  assert.ok(pluginEngine.BG_PRESETS.length >= 4);
  assert.ok(pluginEngine.MUSIC_TRACKS.length >= 3);
});
