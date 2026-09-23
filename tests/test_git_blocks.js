const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

const engine = require(path.join(__dirname, "..", "game", "git-blocks.js"));

function seededGame(extra) {
  let i = 0;
  return engine.createGame({
    pathwayId: "fullstack",
    random: () => {
      i += 1;
      return (i % 97) / 97;
    },
    ...(extra || {}),
  });
}

test("ships expanded tech logo gems for Branchborne", () => {
  assert.equal(engine.GAME_TITLE, "Branchborne Gem Quest");
  assert.ok(engine.GEMS.length >= 14);
  assert.equal(engine.GEM_IDS.length, engine.GEMS.length);
  ["html", "css", "js", "ts", "react", "vue", "php", "wp", "git", "node", "npm", "python", "docker", "sql"].forEach((id) => {
    assert.ok(engine.META[id], `missing gem ${id}`);
    assert.ok(engine.META[id].color);
    assert.ok(engine.META[id].mark);
  });
});

test("pathway classes define RPG careers with affinity and powers", () => {
  assert.ok(engine.PATHWAY_CLASSES.length >= 4);
  engine.PATHWAY_CLASSES.forEach((path) => {
    assert.ok(path.name);
    assert.ok(path.affinity.length >= 4);
    assert.ok(path.power && path.power.name);
    assert.ok(path.character && path.character.glyph);
    assert.ok(path.lessonIds.length >= 10);
    assert.ok(path.backdrop);
    assert.ok(path.clouds.length >= 5);
  });
  assert.equal(engine.pathwayFor("frontend").id, "frontend");
  assert.ok(engine.ENDGAME_CHALLENGES.length >= 3);
  engine.ENDGAME_CHALLENGES.forEach((raid) => {
    assert.ok(raid.goal > 1000);
    assert.ok(raid.moves <= 20);
    assert.ok(raid.bossHp);
  });
});

test("curriculum runs beginner to senior with skills and facts", () => {
  assert.ok(engine.CURRICULUM.length >= 15);
  assert.equal(engine.lessonFor(1, "fullstack").id, "html-bones");
  const len = engine.curriculumLength("fullstack");
  assert.equal(engine.lessonFor(len, "fullstack").id, "senior");
  engine.CURRICULUM.forEach((lesson) => {
    assert.ok(lesson.title);
    assert.ok(lesson.skill && lesson.skill.name);
    assert.ok(lesson.clouds.length >= 5);
    assert.ok(lesson.facts.length >= 2);
  });
  const fact = engine.pickFact(1, () => 0, "fullstack");
  assert.match(fact, /HTML|html|skeleton|semantic|alt/i);
});

test("frontend pathway reorders lessons toward UI craft", () => {
  const first = engine.lessonFor(1, "frontend");
  assert.equal(first.id, "html-bones");
  const lessons = engine.pathwayLessons("frontend");
  assert.ok(lessons.some((l) => l.id === "react-ui"));
  assert.ok(lessons.some((l) => l.id === "senior"));
  assert.ok(lessons.length < engine.CURRICULUM.length || lessons.length === engine.CURRICULUM.length);
});

test("each clear queues a lesson fact popup payload", () => {
  const game = seededGame();
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
  assert.ok(snap.mana > 0);
  assert.equal(snap.pathwayId, "fullstack");
  const pending = game.consumeFact();
  assert.ok(pending);
  assert.ok(pending.fact && pending.fact.length > 10);
  assert.ok(pending.lesson);
  assert.ok(pending.rank);
  assert.ok(pending.track);
  assert.ok(pending.clouds && pending.clouds.length >= 3);
  assert.ok(pending.level >= 1);
  assert.ok(pending.total >= 15);
  assert.equal(game.consumeFact(), null);
});

test("play opens a live side quest instead of a blocking lesson modal", () => {
  const game = seededGame();
  assert.equal(game.consumeLessonIntro(), null);
  game.play();
  assert.equal(game.consumeLessonIntro(), null);
  const snap = game.snapshot();
  assert.ok(snap.activeQuest);
  assert.equal(snap.activeQuest.title, "HTML bones");
  assert.equal(snap.activeQuest.rank, "Intern");
  assert.ok(snap.activeQuest.goal >= 100);
  assert.ok(snap.activeQuest.tip && snap.activeQuest.tip.length > 10);
  assert.ok(snap.trophyCatalog.length >= 8);
  assert.ok(snap.itemCatalog.length >= 8);
});

test("trophies and loot catalogs unlock from play progress", () => {
  assert.ok(engine.TROPHIES.length >= 8);
  assert.ok(engine.LOOT_ITEMS.length >= 8);
  const game = seededGame();
  game.play();
  let hint = engine.findHint(game.snapshot().board);
  for (let n = 0; n < 6 && !hint; n += 1) {
    game.shuffle(true);
    hint = engine.findHint(game.snapshot().board);
  }
  assert.ok(hint);
  game.trySwap(hint.a, hint.b);
  const snap = game.snapshot();
  assert.ok(snap.trophies.length >= 1);
  assert.ok(snap.items.length >= 1);
});

test("pathway powers are class-themed and characters render", () => {
  const byId = Object.fromEntries(engine.PATHWAY_CLASSES.map((p) => [p.id, p]));
  assert.equal(byId.frontend.power.id, "ui-burst");
  assert.match(byId.frontend.power.name, /Style Nova|Burst|Nova/i);
  assert.equal(byId.backend.power.id, "query-storm");
  assert.equal(byId.wordpress.power.id, "hook-cascade");
  assert.equal(byId.fullstack.power.id, "polyglot-pulse");
  engine.PATHWAY_CLASSES.forEach((path) => {
    assert.ok(path.character && path.character.silhouette);
    const html = engine.cartoonCharacterMarkup(
      path.character.silhouette,
      path.character.colors,
      path.character.idle
    );
    assert.match(html, /chibi-svg/);
    assert.match(html, new RegExp(`chibi-${path.character.silhouette}`));
  });
  const classic = engine.cartoonCharacterMarkup("classic", ["#4f8fd4", "#0d2e57", "#e7c35a"], "float");
  assert.match(classic, /chibi-classic/);
});

test("class select is required before play without pathwayId", () => {
  const game = engine.createGame({ random: () => 0.3 });
  assert.equal(game.status, "class-select");
  game.play();
  assert.equal(game.status, "class-select");
  assert.equal(game.choosePathway("frontend"), true);
  assert.equal(game.status, "ready");
  assert.equal(game.snapshot().pathway.name, "Frontend Mage");
  game.play();
  assert.equal(game.status, "playing");
});

test("endgame raids unlock after senior path clears", () => {
  const raid = engine.lessonFor(1, "backend", "endgame", 0);
  assert.equal(raid.id, "prod-outage");
  assert.match(raid.title, /Raid|Outage/i);

  const game = engine.createGame({
    pathwayId: "backend",
    startPhase: "endgame",
    random: () => 0.41,
  });
  assert.equal(game.snapshot().phase, "endgame");
  assert.equal(game.snapshot().graduated, true);
  assert.ok(game.snapshot().goal >= 2000);
  assert.ok(game.snapshot().bossHp >= 2000);
  game.play();
  assert.equal(game.status, "playing");
  assert.match(game.snapshot().lessonTitle, /Raid/i);
});

test("class power casts when mana is full", () => {
  const game = seededGame({ pathwayId: "wordpress" });
  game.play();
  // Fill mana by matching until ready or cap attempts
  let guard = 0;
  while (!game.snapshot().powerReady && guard < 80) {
    guard += 1;
    let hint = engine.findHint(game.snapshot().board);
    if (!hint) {
      game.shuffle(true);
      hint = engine.findHint(game.snapshot().board);
    }
    if (!hint) break;
    if (game.snapshot().moves < 2) break;
    game.trySwap(hint.a, hint.b);
  }
  if (game.snapshot().powerReady) {
    const beforeHints = game.snapshot().hints;
    const result = game.castPower();
    assert.equal(result.ok, true);
    assert.equal(result.power.id, "hook-cascade");
    assert.ok(game.snapshot().powersUsed >= 1);
    assert.ok(game.snapshot().hints >= beforeHints || game.snapshot().shuffles >= 1);
  } else {
    // Mana fill is probabilistic; at least cast rejects when not ready
    const denied = game.castPower();
    assert.equal(denied.ok, false);
  }
});

test("findMatches detects horizontal and vertical runs of three+", () => {
  const board = Array.from({ length: engine.ROWS }, () => Array(engine.COLS).fill("css"));
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
  const game = engine.createGame({
    pathwayId: "frontend",
    random: () => (i++ % 10) / 10,
  });
  assert.equal(game.status, "ready");
  game.play();
  assert.equal(game.status, "playing");
  const snap = game.snapshot();
  assert.equal(snap.board.length, engine.SIZE);
  assert.equal(snap.board[0].length, engine.SIZE);
  assert.ok(snap.moves > 0);
  assert.ok(snap.goal > 0);
  assert.equal(snap.pathwayId, "frontend");
});

test("successful swap clears gems and scores", () => {
  const game = seededGame();
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
    pathwayId: "fullstack",
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
  assert.match(html, /pathway|senior|quest|trophies/i);
  assert.match(html, /data-quest-rail/);
  assert.match(html, /data-trophy-board/);
  assert.doesNotMatch(html, /Hard drop/);
  assert.equal(typeof engine.boot, "function");
  assert.ok(fs.existsSync(path.join(gameDir, "audio", "stack-sprint.ogg")));
});

test("trophy catalog ships and facts stay off the board overlay", () => {
  const game = seededGame();
  const snap = game.snapshot();
  assert.ok(Array.isArray(snap.trophyCatalog));
  assert.ok(snap.trophyCatalog.length >= 5);
  assert.ok(snap.trophyCatalog.every((t) => t.id && t.name && typeof t.owned === "boolean"));
  assert.ok(Array.isArray(snap.itemCatalog));
  const src = fs.readFileSync(path.join(__dirname, "..", "game", "git-blocks.js"), "utf8");
  assert.match(src, /openTrophyCase/);
  assert.match(src, /data-trophy-case/);
  assert.match(src, /Retired: web-dev facts only appear as the quest-column tip/);
  const css = fs.readFileSync(path.join(__dirname, "..", "game", "git-blocks.css"), "utf8");
  assert.match(css, /\.trophy-case/);
  assert.match(css, /\.fact-toast[\s\S]*display:\s*none\s*!important/);
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
  assert.ok(pluginEngine.GEMS.length >= 14);
  assert.equal(typeof pluginEngine.createGame, "function");
});
