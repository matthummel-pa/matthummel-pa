const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const engine = require(path.join(__dirname, "..", "game", "git-blocks.js"));

test("ships ten web-dev logo gems", () => {
  assert.equal(engine.GEMS.length, 10);
  assert.equal(engine.GEM_IDS.length, 10);
  ["html", "css", "js", "ts", "react", "php", "wp", "git", "node", "npm"].forEach((id) => {
    assert.ok(engine.META[id], `missing gem ${id}`);
    assert.ok(engine.META[id].color);
    assert.ok(engine.META[id].mark);
  });
});

test("curriculum runs beginner to senior with skills and facts", () => {
  assert.ok(engine.CURRICULUM.length >= 15);
  assert.equal(engine.lessonFor(1).id, "html-bones");
  assert.equal(engine.lessonFor(engine.CURRICULUM.length).id, "senior");
  engine.CURRICULUM.forEach((lesson) => {
    assert.ok(lesson.title);
    assert.ok(lesson.skill && lesson.skill.name);
    assert.ok(lesson.clouds.length >= 5);
    assert.ok(lesson.facts.length >= 2);
  });
  const fact = engine.pickFact(1, () => 0);
  assert.match(fact, /HTML|html|skeleton|semantic|alt/i);
});

test("matches award lines of code not abstract score", () => {
  let i = 0;
  const game = engine.createGame({
    random: () => {
      i += 1;
      return (i % 97) / 97;
    },
  });
  game.play();
  let hint = engine.findHint(game.snapshot().board);
  for (let n = 0; n < 8 && !hint; n += 1) {
    game.shuffle(true);
    hint = engine.findHint(game.snapshot().board);
  }
  assert.ok(hint);
  const result = game.trySwap(hint.a, hint.b);
  assert.equal(result.ok, true);
  const snap = game.snapshot();
  assert.ok(snap.linesOfCode > 0);
  assert.equal(snap.score, snap.linesOfCode);
  assert.ok(snap.skills.length >= 1);
  assert.ok(snap.pendingFact || snap.lastFact);
});

test("findMatches detects horizontal and vertical runs of three+", () => {
  const board = Array.from({ length: engine.ROWS }, () => Array(engine.COLS).fill("css"));
  // break into mostly unique except one row and column
  for (let y = 0; y < engine.ROWS; y += 1) {
    for (let x = 0; x < engine.COLS; x += 1) {
      board[y][x] = engine.GEM_IDS[(x + y) % engine.GEM_IDS.length];
    }
  }
  board[0][0] = "html";
  board[0][1] = "html";
  board[0][2] = "html";
  board[1][4] = "react";
  board[2][4] = "react";
  board[3][4] = "react";
  const found = engine.findMatches(board);
  assert.ok(found.cells.length >= 6);
  assert.ok(found.groups.some((g) => g.axis === "h"));
  assert.ok(found.groups.some((g) => g.axis === "v"));
});

test("wouldMatch only accepts adjacent legal swaps", () => {
  const board = Array.from({ length: engine.ROWS }, () => Array(engine.COLS).fill(null));
  for (let y = 0; y < engine.ROWS; y += 1) {
    for (let x = 0; x < engine.COLS; x += 1) {
      board[y][x] = engine.GEM_IDS[(x * 3 + y * 5) % engine.GEM_IDS.length];
    }
  }
  // craft a known matchable swap: two html already adjacent, bring third in
  board[0][0] = "js";
  board[0][1] = "html";
  board[0][2] = "html";
  board[1][0] = "html";
  assert.equal(engine.areAdjacent({ x: 0, y: 0 }, { x: 1, y: 0 }), true);
  assert.equal(engine.wouldMatch(board, { x: 0, y: 0 }, { x: 0, y: 1 }), true);
  assert.equal(engine.wouldMatch(board, { x: 0, y: 0 }, { x: 2, y: 2 }), false);
});

test("createGame starts ready and play enables swapping", () => {
  let i = 0;
  const game = engine.createGame({ random: () => (i++ % 10) / 10 });
  assert.equal(game.status, "ready");
  game.play();
  assert.equal(game.status, "playing");
  const snap = game.snapshot();
  assert.equal(snap.board.length, engine.SIZE);
  assert.equal(snap.board[0].length, engine.SIZE);
  assert.ok(snap.moves > 0);
  assert.ok(snap.goal > 0);
});

test("successful swap clears gems and scores", () => {
  let i = 0;
  const game = engine.createGame({
    random: () => {
      i += 1;
      return (i % 97) / 97;
    },
  });
  game.play();
  let hint = engine.findHint(game.snapshot().board);
  for (let n = 0; n < 8 && !hint; n += 1) {
    game.shuffle(true);
    hint = engine.findHint(game.snapshot().board);
  }
  assert.ok(hint, "expected a valid hint after reshuffles");
  const before = game.snapshot();
  const result = game.trySwap(hint.a, hint.b);
  assert.equal(result.ok, true);
  const after = game.snapshot();
  assert.ok(after.score > before.score);
  assert.ok(after.matches >= 1);
  assert.ok(after.cleared >= 3);
});

test("invalid swap bounces without spending a move", () => {
  let i = 0;
  const game = engine.createGame({
    random: () => {
      i += 1;
      return (i % 53) / 53;
    },
  });
  game.play();
  const snap = game.snapshot();
  assert.equal(engine.boardHasMatch(snap.board), false);
  let a = null;
  let b = null;
  outer: for (let y = 0; y < engine.ROWS; y += 1) {
    for (let x = 0; x < engine.COLS - 1; x += 1) {
      if (!engine.wouldMatch(snap.board, { x, y }, { x: x + 1, y })) {
        a = { x, y };
        b = { x: x + 1, y };
        break outer;
      }
    }
  }
  assert.ok(a && b, "expected at least one non-matching adjacent pair");
  const beforeMoves = game.snapshot().moves;
  const result = game.trySwap(a, b);
  assert.equal(result.ok, false);
  assert.equal(result.bounce, true);
  assert.equal(game.snapshot().moves, beforeMoves);
});

test("WordGenerator still emits cloud tokens", () => {
  const cloud = engine.WordGenerator.generateCloud(12, () => 0.2);
  assert.equal(cloud.length, 12);
  assert.ok(cloud.every((t) => t.text.length > 0));
});

test("player files ship match-3 cabinet", () => {
  const gameDir = path.join(__dirname, "..", "game");
  const html = fs.readFileSync(path.join(gameDir, "index.html"), "utf8");
  assert.match(html, /data-git-blocks/);
  assert.match(html, /data-dev-clouds/);
  assert.match(html, /data-gem-legend/);
  assert.match(html, /data-hint/);
  assert.match(html, /data-shuffle/);
  assert.match(html, /data-skills/);
  assert.match(html, /Lines of code/);
  assert.match(html, /Start learning|senior/i);
  assert.doesNotMatch(html, /Hard drop/);
  assert.equal(typeof engine.boot, "function");
  assert.ok(fs.existsSync(path.join(gameDir, "audio", "stack-sprint.ogg")));
});

test("docs/ mirrors game for branch-based GitHub Pages", () => {
  const docsDir = path.join(__dirname, "..", "docs");
  const html = fs.readFileSync(path.join(docsDir, "index.html"), "utf8");
  assert.match(html, /data-git-blocks/);
  assert.match(html, /git-blocks\.js/);
  assert.ok(fs.existsSync(path.join(docsDir, "git-blocks.css")));
  assert.ok(fs.existsSync(path.join(docsDir, "git-blocks.js")));
  assert.ok(fs.existsSync(path.join(docsDir, ".nojekyll")));
});

test("wordpress plugin sample packs the cabinet", () => {
  const plugin = path.join(__dirname, "..", "samples", "git-blocks");
  assert.ok(fs.existsSync(path.join(plugin, "git-blocks.php")));
  assert.ok(fs.existsSync(path.join(plugin, "assets", "js", "git-blocks.js")));
  assert.ok(fs.existsSync(path.join(plugin, "assets", "css", "git-blocks.css")));
  const pluginEngine = require(path.join(plugin, "assets", "js", "git-blocks.js"));
  assert.equal(pluginEngine.GEMS.length, 10);
  assert.equal(typeof pluginEngine.createGame, "function");
});
