/**
 * Git Blocks — Jewel Quest–style match-3 cabinet for Matt's GitHub profile.
 * Swap adjacent web-dev logo gems. Match 3+ in a row or column. Cascades score big.
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

  const SIZE = 8;
  const COLS = SIZE;
  const ROWS = SIZE;
  const MATCH_MIN = 3;

  /** Ten shiny web-dev logo gems (stylized marks — not official trademarks). */
  const GEMS = [
    { id: "html", label: "HTML", color: "#e34c26", accent: "#ff7a4d", ink: "#ffffff", mark: "html" },
    { id: "css", label: "CSS", color: "#264de4", accent: "#5b8cff", ink: "#ffffff", mark: "css" },
    { id: "js", label: "JS", color: "#f0db4f", accent: "#fff3a0", ink: "#1a1a1a", mark: "js" },
    { id: "ts", label: "TS", color: "#3178c6", accent: "#6aa8e8", ink: "#ffffff", mark: "ts" },
    { id: "react", label: "React", color: "#61dafb", accent: "#b6f0ff", ink: "#0b1220", mark: "react" },
    { id: "php", label: "PHP", color: "#777bb4", accent: "#a8abe0", ink: "#ffffff", mark: "php" },
    { id: "wp", label: "WP", color: "#21759b", accent: "#4fa8ce", ink: "#ffffff", mark: "wp" },
    { id: "git", label: "Git", color: "#f05032", accent: "#ff8a6e", ink: "#ffffff", mark: "git" },
    { id: "node", label: "Node", color: "#339933", accent: "#6dcf6d", ink: "#ffffff", mark: "node" },
    { id: "npm", label: "npm", color: "#cb3837", accent: "#f06a68", ink: "#ffffff", mark: "npm" },
  ];

  const GEM_IDS = GEMS.map((g) => g.id);
  const META = Object.fromEntries(GEMS.map((g) => [g.id, g]));

  /**
   * Learning path: beginner → senior developer.
   * Each level unlocks an RPG-style skill, themed cloud words, and lesson facts.
   */
  const CURRICULUM = [
    {
      id: "html-bones",
      title: "HTML bones",
      track: "Junior",
      rank: "Intern",
      skill: { id: "markup", name: "Markup Adept", icon: "</>", blurb: "Structure the page with semantic HTML." },
      clouds: ["<!DOCTYPE>", "<html>", "<head>", "<body>", "<h1>", "<p>", "<a>", "semantic", "alt text", "section"],
      facts: [
        "HTML is the skeleton of every webpage — tags describe meaning, not looks.",
        "Prefer semantic tags like <main> and <nav> over endless <div> soup.",
        "Every image needs an alt attribute so assistive tech can describe it.",
      ],
    },
    {
      id: "css-paint",
      title: "CSS paint",
      track: "Junior",
      rank: "Apprentice",
      skill: { id: "styling", name: "Style Caster", icon: "#", blurb: "Paint the UI with selectors and the cascade." },
      clouds: ["color", "font-size", "margin", "padding", "border", "class", "id", "cascade", ":hover", "specificity"],
      facts: [
        "CSS stands for Cascading Style Sheets — later rules can override earlier ones.",
        "Classes (.btn) are reusable; IDs (#hero) should be unique on a page.",
        "The box model is content → padding → border → margin.",
      ],
    },
    {
      id: "layout-lab",
      title: "Layout lab",
      track: "Junior",
      rank: "Apprentice",
      skill: { id: "layout", name: "Flex Sensei", icon: "▦", blurb: "Arrange space with Flexbox and Grid." },
      clouds: ["display:flex", "justify-content", "align-items", "gap", "grid", "fr", "minmax()", "auto-fit", "container", "position"],
      facts: [
        "Flexbox is one-dimensional (row or column); Grid is two-dimensional.",
        "gap replaces most margin hacks between siblings.",
        "Use fr units in Grid to share leftover space fairly.",
      ],
    },
    {
      id: "responsive",
      title: "Responsive craft",
      track: "Junior",
      rank: "Padawan",
      skill: { id: "responsive", name: "Viewport Ranger", icon: "⧉", blurb: "Design fluid layouts for every screen." },
      clouds: ["@media", "min-width", "clamp()", "rem", "vw", "mobile-first", "breakpoint", "fluid", "srcset", "aspect-ratio"],
      facts: [
        "Mobile-first CSS starts simple, then adds @media for larger screens.",
        "rem sizes scale with the root font size — friendlier for a11y.",
        "clamp(min, preferred, max) is a one-line fluid type trick.",
      ],
    },
    {
      id: "js-spark",
      title: "JS spark",
      track: "Junior",
      rank: "Padawan",
      skill: { id: "js-basics", name: "Script Starter", icon: "JS", blurb: "Speak the language of the browser." },
      clouds: ["const", "let", "function", "=>", "array", "object", "if/else", "for", "typeof", "truthy"],
      facts: [
        "Prefer const; use let when a value must change. Avoid var in modern code.",
        "=== checks value and type; == can coerce unexpectedly.",
        "Arrays and objects are reference types — copying needs care.",
      ],
    },
    {
      id: "dom-events",
      title: "DOM & events",
      track: "Junior",
      rank: "Contributor",
      skill: { id: "dom", name: "DOM Whisperer", icon: "⚡", blurb: "Listen, update, and react to the page." },
      clouds: ["querySelector", "addEventListener", "click", "preventDefault", "dataset", "classList", "textContent", "createElement", "bubbling", "delegation"],
      facts: [
        "The DOM is the live tree the browser builds from your HTML.",
        "Event delegation: listen on a parent, handle many children.",
        "prefer textContent over innerHTML when inserting plain text.",
      ],
    },
    {
      id: "git-flow",
      title: "Git flow",
      track: "Junior",
      rank: "Contributor",
      skill: { id: "git", name: "Commit Keeper", icon: "⌥", blurb: "Version history without fear." },
      clouds: ["git init", "git status", "git add", "git commit", "branch", "merge", "pull", "push", "diff", "PR"],
      facts: [
        "Commits are snapshots — write messages that explain why, not only what.",
        "Branches let you experiment without breaking main.",
        "A pull request is a reviewable proposal to merge your work.",
      ],
    },
    {
      id: "tooling",
      title: "Tooling & npm",
      track: "Mid",
      rank: "Engineer",
      skill: { id: "tooling", name: "Package Pilot", icon: "npm", blurb: "Install, script, and ship with confidence." },
      clouds: ["package.json", "npm install", "npx", "scripts", "devDep", "lockfile", "vite", "bundler", "lint", "format"],
      facts: [
        "package.json lists dependencies and npm scripts for your project.",
        "Lockfiles keep installs reproducible across machines.",
        "Separate dependencies (runtime) from devDependencies (build/test).",
      ],
    },
    {
      id: "a11y",
      title: "Accessibility",
      track: "Mid",
      rank: "Engineer",
      skill: { id: "a11y", name: "A11y Guardian", icon: "♿", blurb: "Build for every human, not every mouse." },
      clouds: ["aria-label", "role", "focus", "tabindex", "contrast", "screen reader", "keyboard", "landmark", "WCAG", "skip link"],
      facts: [
        "If it works with keyboard alone, you’re halfway to solid a11y.",
        "Color contrast isn’t decoration — it’s readability.",
        "ARIA should enhance semantics, not replace good HTML.",
      ],
    },
    {
      id: "typescript",
      title: "TypeScript",
      track: "Mid",
      rank: "Engineer",
      skill: { id: "types", name: "Type Warden", icon: "TS", blurb: "Catch bugs before they ship." },
      clouds: ["interface", "type", "generic", "union", "optional?", "strict", "unknown", "as const", "enum", "infer"],
      facts: [
        "TypeScript adds static types that erase to plain JavaScript at build time.",
        "Start with strict mode — it teaches better habits early.",
        "unknown is safer than any when you truly don’t know yet.",
      ],
    },
    {
      id: "react-ui",
      title: "React components",
      track: "Mid",
      rank: "Builder",
      skill: { id: "react", name: "Component Crafter", icon: "⚛", blurb: "Compose UI from reusable pieces." },
      clouds: ["JSX", "props", "component", "children", "key", "Fragment", "composition", "pure", "render", "tree"],
      facts: [
        "Components are functions that return UI descriptions (JSX).",
        "Props flow down; events bubble intent back up.",
        "Stable keys help React reconcile lists without thrashing.",
      ],
    },
    {
      id: "hooks-state",
      title: "State & hooks",
      track: "Mid",
      rank: "Builder",
      skill: { id: "hooks", name: "State Alchemist", icon: "Σ", blurb: "Manage change without losing clarity." },
      clouds: ["useState", "useEffect", "useRef", "useMemo", "dependency", "stale closure", "derived state", "reducer", "context", "batching"],
      facts: [
        "useState holds values that should re-render the UI when they change.",
        "useEffect runs after paint — declare every dependency you read.",
        "Prefer deriving values over mirroring props into state.",
      ],
    },
    {
      id: "php-wp",
      title: "PHP & WordPress",
      track: "Mid",
      rank: "Specialist",
      skill: { id: "wordpress", name: "CMS Artisan", icon: "W", blurb: "Server-render and extend WordPress safely." },
      clouds: ["<?php", "functions.php", "hook", "add_action", "WP_Query", "the_content", "template", "nonce", "sanitize", "escape"],
      facts: [
        "WordPress plugins hang behavior on hooks (actions & filters).",
        "Escape on output, sanitize on input — never trust raw request data.",
        "Themes control presentation; plugins should own features.",
      ],
    },
    {
      id: "apis",
      title: "APIs & data",
      track: "Mid",
      rank: "Specialist",
      skill: { id: "api", name: "Fetch Ranger", icon: "{}", blurb: "Talk to services over HTTP with care." },
      clouds: ["fetch", "JSON", "REST", "GET", "POST", "status", "async/await", "CORS", "GraphQL", "cache"],
      facts: [
        "HTTP status codes tell stories: 2xx ok, 4xx your fault, 5xx theirs.",
        "async/await is syntactic sugar over Promises — still handle errors.",
        "Never put secrets in frontend code; the browser is public.",
      ],
    },
    {
      id: "testing",
      title: "Testing craft",
      track: "Senior track",
      rank: "Lead-path",
      skill: { id: "testing", name: "Spec Sentinel", icon: "✓", blurb: "Prove behavior before users find bugs." },
      clouds: ["unit test", "integration", "e2e", "assert", "mock", "fixture", "coverage", "regression", "CI", "TDD"],
      facts: [
        "Tests document intent — write the name like a sentence.",
        "Mock at boundaries; don’t mock the thing you’re testing.",
        "A red test that fails for the right reason is a gift.",
      ],
    },
    {
      id: "performance",
      title: "Performance",
      track: "Senior track",
      rank: "Lead-path",
      skill: { id: "perf", name: "Perf Pathfinder", icon: "⏱", blurb: "Ship fast experiences on slow networks." },
      clouds: ["LCP", "CLS", "INP", "lazy-load", "code-split", "cache", "CDN", "bundle size", "waterfall", "profile"],
      facts: [
        "Core Web Vitals measure real user experience, not just lab scores.",
        "The fastest request is the one you never make.",
        "Measure before optimizing — profiles beat hunches.",
      ],
    },
    {
      id: "security",
      title: "Web security",
      track: "Senior track",
      rank: "Guardian",
      skill: { id: "security", name: "Threat Shield", icon: "⌁", blurb: "Defend users from the obvious attacks." },
      clouds: ["XSS", "CSRF", "HTTPS", "CSP", "auth", "hash", "salt", "JWT", "owasp", "escape"],
      facts: [
        "XSS injects hostile scripts — treat all user input as untrusted.",
        "HTTPS encrypts traffic so eavesdroppers can’t casually read it.",
        "Least privilege: accounts and tokens should only do what they need.",
      ],
    },
    {
      id: "architecture",
      title: "Architecture",
      track: "Senior",
      rank: "Architect",
      skill: { id: "architecture", name: "System Cartographer", icon: "⬡", blurb: "Design boundaries that survive change." },
      clouds: ["module", "boundary", "coupling", "cohesion", "ADR", "event", "queue", "idempotent", "SLA", "observability"],
      facts: [
        "Good architecture makes the common change easy and the rare change possible.",
        "Coupling is the cost of a shortcut you’ll pay later.",
        "Write ADRs for decisions your future team will debate.",
      ],
    },
    {
      id: "leadership",
      title: "Tech leadership",
      track: "Senior",
      rank: "Staff-path",
      skill: { id: "leadership", name: "Mentor Beacon", icon: "★", blurb: "Raise the team’s ceiling, not just your own." },
      clouds: ["code review", "RFC", "pairing", "mentorship", "roadmap", "tradeoff", "scope", "comms", "incident", "retro"],
      facts: [
        "Senior means multiplying others — reviews, docs, and calm incidents.",
        "Say the tradeoff out loud: speed, quality, or scope — pick two for now.",
        "Retros without blame turn outages into institutional memory.",
      ],
    },
    {
      id: "senior",
      title: "Senior developer",
      track: "Senior",
      rank: "Senior Dev",
      skill: { id: "senior", name: "Senior Sigil", icon: "◆", blurb: "You ship judgment, not just features." },
      clouds: ["ownership", "clarity", "judgment", "impact", "craft", "reliability", "empathy", "systems", "legacy", "ship"],
      facts: [
        "A senior developer reduces ambiguity for everyone around them.",
        "You optimize for long-term leverage: tools, people, and platforms.",
        "Graduation unlocked — keep learning; the web never stands still.",
      ],
    },
  ];

  const ACHIEVEMENTS = [
    { id: "first-match", label: "First commit", test: (s) => s.matches >= 1 },
    { id: "cascade-3", label: "Cascade ×3", test: (s) => s.maxChain >= 3 },
    { id: "combo-5", label: "Combo ×5", test: (s) => s.maxCombo >= 5 },
    { id: "loc-500", label: "500 LOC", test: (s) => s.linesOfCode >= 500 },
    { id: "lesson-5", label: "Lesson 5", test: (s) => s.level >= 5 },
    { id: "four-line", label: "Quad match", test: (s) => s.quads >= 1 },
    { id: "skill-3", label: "3 skills", test: (s) => Object.keys(s.skills || {}).length >= 3 },
    { id: "senior-path", label: "Senior path", test: (s) => s.level >= CURRICULUM.length },
  ];

  function lessonFor(level) {
    const idx = Math.max(0, Math.min(CURRICULUM.length - 1, (level || 1) - 1));
    return CURRICULUM[idx];
  }

  function sprintName(level) {
    return lessonFor(level).title;
  }

  function goalForLevel(level) {
    // Lines-of-code goals grow with seniority.
    return 600 + (Math.max(1, level) - 1) * 350;
  }

  function movesForLevel(level) {
    return Math.max(18, 32 - Math.min(12, level - 1));
  }

  function gemKindsForLevel(level) {
    return Math.min(GEM_IDS.length, 5 + Math.min(5, Math.floor((level - 1) / 2) + 1));
  }

  function pickFact(level, random) {
    const lesson = lessonFor(level);
    const facts = lesson.facts || [];
    if (!facts.length) return "Keep shipping — every match writes more of your story.";
    const rnd = random || Math.random;
    return facts[Math.floor(rnd() * facts.length)];
  }

  function pickGemId(random, level) {
    const n = gemKindsForLevel(level || 1);
    return GEM_IDS[Math.floor(random() * n)];
  }

  function emptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function cloneBoard(board) {
    return board.map((row) => row.slice());
  }

  function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < COLS && y < ROWS;
  }

  function areAdjacent(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
  }

  function findMatches(board) {
    const marked = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    const groups = [];

    // Horizontal
    for (let y = 0; y < ROWS; y += 1) {
      let x = 0;
      while (x < COLS) {
        const kind = board[y][x];
        if (!kind) {
          x += 1;
          continue;
        }
        let len = 1;
        while (x + len < COLS && board[y][x + len] === kind) len += 1;
        if (len >= MATCH_MIN) {
          const cells = [];
          for (let i = 0; i < len; i += 1) {
            marked[y][x + i] = true;
            cells.push({ x: x + i, y, kind });
          }
          groups.push({ kind, cells, axis: "h" });
        }
        x += len;
      }
    }

    // Vertical
    for (let x = 0; x < COLS; x += 1) {
      let y = 0;
      while (y < ROWS) {
        const kind = board[y][x];
        if (!kind) {
          y += 1;
          continue;
        }
        let len = 1;
        while (y + len < ROWS && board[y + len][x] === kind) len += 1;
        if (len >= MATCH_MIN) {
          const cells = [];
          for (let i = 0; i < len; i += 1) {
            marked[y + i][x] = true;
            cells.push({ x, y: y + i, kind });
          }
          groups.push({ kind, cells, axis: "v" });
        }
        y += len;
      }
    }

    const cells = [];
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (marked[y][x]) cells.push({ x, y, kind: board[y][x] });
      }
    }
    return { cells, groups, marked };
  }

  function boardHasMatch(board) {
    return findMatches(board).cells.length > 0;
  }

  function applyGravity(board, random, level) {
    const next = emptyBoard();
    const falls = [];
    for (let x = 0; x < COLS; x += 1) {
      let write = ROWS - 1;
      for (let y = ROWS - 1; y >= 0; y -= 1) {
        if (board[y][x]) {
          next[write][x] = board[y][x];
          if (write !== y) falls.push({ kind: board[y][x], from: { x, y }, to: { x, y: write } });
          write -= 1;
        }
      }
      while (write >= 0) {
        const kind = pickGemId(random, level);
        next[write][x] = kind;
        falls.push({ kind, from: { x, y: write - ROWS }, to: { x, y: write }, spawn: true });
        write -= 1;
      }
    }
    return { board: next, falls };
  }

  function clearCells(board, cells) {
    const next = cloneBoard(board);
    cells.forEach(({ x, y }) => {
      next[y][x] = null;
    });
    return next;
  }

  function resolveBoard(board, random, level) {
    let working = cloneBoard(board);
    const waves = [];
    let chain = 0;
    for (;;) {
      const found = findMatches(working);
      if (!found.cells.length) break;
      chain += 1;
      working = clearCells(working, found.cells);
      const grav = applyGravity(working, random, level);
      working = grav.board;
      waves.push({
        chain,
        cells: found.cells,
        groups: found.groups,
        falls: grav.falls,
      });
      // Safety: avoid infinite loops on pathological boards
      if (chain > 40) break;
    }
    return { board: working, waves, chain };
  }

  function swapCells(board, a, b) {
    const next = cloneBoard(board);
    const tmp = next[a.y][a.x];
    next[a.y][a.x] = next[b.y][b.x];
    next[b.y][b.x] = tmp;
    return next;
  }

  function wouldMatch(board, a, b) {
    if (!areAdjacent(a, b)) return false;
    return boardHasMatch(swapCells(board, a, b));
  }

  function findHint(board) {
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const right = { x: x + 1, y };
        const down = { x, y: y + 1 };
        if (inBounds(right.x, right.y) && wouldMatch(board, { x, y }, right)) {
          return { a: { x, y }, b: right };
        }
        if (inBounds(down.x, down.y) && wouldMatch(board, { x, y }, down)) {
          return { a: { x, y }, b: down };
        }
      }
    }
    return null;
  }

  function hasValidMoves(board) {
    return Boolean(findHint(board));
  }

  function fillBoardNoMatches(random, level) {
    const board = emptyBoard();
    const n = gemKindsForLevel(level || 1);
    const pool = GEM_IDS.slice(0, n);
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const order = shuffleArray(pool, random);
        let placed = false;
        for (let i = 0; i < order.length; i += 1) {
          board[y][x] = order[i];
          if (!createsImmediateMatch(board, x, y)) {
            placed = true;
            break;
          }
        }
        if (!placed) board[y][x] = order[0];
      }
    }
    // Reshuffle until playable and match-free
    let tries = 0;
    while ((boardHasMatch(board) || !hasValidMoves(board)) && tries < 50) {
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          const order = shuffleArray(pool, random);
          let placed = false;
          for (let i = 0; i < order.length; i += 1) {
            board[y][x] = order[i];
            if (!createsImmediateMatch(board, x, y)) {
              placed = true;
              break;
            }
          }
          if (!placed) board[y][x] = order[x % order.length];
        }
      }
      tries += 1;
    }
    return board;
  }

  function createsImmediateMatch(board, x, y) {
    const kind = board[y][x];
    if (!kind) return false;
    if (x >= 2 && board[y][x - 1] === kind && board[y][x - 2] === kind) return true;
    if (y >= 2 && board[y - 1][x] === kind && board[y - 2][x] === kind) return true;
    return false;
  }

  function scoreMatch(cellCount, chain, level) {
    // Each matched gem ≈ lines of code written toward the lesson goal.
    const base = cellCount * 28;
    const chainBonus = 1 + (chain - 1) * 0.55;
    return Math.round(base * chainBonus * (1 + (level - 1) * 0.08));
  }

  function createGame(options) {
    const opts = options || {};
    const random = opts.random || Math.random;
    const now = opts.now || (() => Date.now());
    const state = {
      board: fillBoardNoMatches(random, 1),
      linesOfCode: 0,
      score: 0, // alias kept for older callers / high-score storage
      level: 1,
      levelScore: 0,
      goal: goalForLevel(1),
      moves: movesForLevel(1),
      matches: 0,
      cleared: 0,
      combo: 0,
      maxCombo: 0,
      maxChain: 0,
      quads: 0,
      hints: 2,
      shuffles: 2,
      hintsUsed: 0,
      shufflesUsed: 0,
      achievements: {},
      skills: {},
      lastFact: null,
      pendingFact: null,
      skillUnlock: null,
      commitLog: [],
      fx: [],
      status: "ready",
      message: "Lesson 1 — HTML bones. Swap gems to write your first lines of code.",
      selected: null,
      hint: null,
      levelFlash: 0,
      busy: false,
    };

    // Unlock lesson 1 skill at start of play path
    function grantLessonSkill(level) {
      const lesson = lessonFor(level);
      if (!lesson.skill) return null;
      if (state.skills[lesson.skill.id]) return null;
      state.skills[lesson.skill.id] = {
        ...lesson.skill,
        level,
        unlockedAt: now(),
      };
      state.skillUnlock = { ...state.skills[lesson.skill.id], lesson: lesson.title };
      pushLog(`skill unlocked: ${lesson.skill.name}`);
      return state.skills[lesson.skill.id];
    }

    function pushLog(entry) {
      state.commitLog.unshift(entry);
      if (state.commitLog.length > 6) state.commitLog.length = 6;
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

    function applyWaves(waves) {
      if (!waves.length) {
        state.combo = 0;
        return { sounds: [], fact: null };
      }
      const sounds = [];
      let fact = null;
      waves.forEach((wave) => {
        state.combo += 1;
        state.maxCombo = Math.max(state.maxCombo, state.combo);
        state.maxChain = Math.max(state.maxChain, wave.chain);
        state.matches += 1;
        state.cleared += wave.cells.length;
        const loc = scoreMatch(wave.cells.length, wave.chain, state.level);
        state.linesOfCode += loc;
        state.score = state.linesOfCode;
        state.levelScore += loc;
        wave.groups.forEach((g) => {
          if (g.cells.length >= 4) state.quads += 1;
        });
        const label = (META[wave.cells[0] && wave.cells[0].kind] || {}).label || "gem";
        pushLog(`+${loc} LOC · ${label} ×${wave.cells.length} · chain ${wave.chain}`);
        fact = pickFact(state.level, random);
        state.lastFact = fact;
        state.pendingFact = {
          fact,
          lesson: lessonFor(state.level).title,
          track: lessonFor(state.level).track,
          loc,
          chain: wave.chain,
          at: now(),
        };
        state.fx.push({
          id: `match-${now()}-${wave.chain}`,
          at: now(),
          type: "match",
          chain: wave.chain,
          cells: wave.cells,
          falls: wave.falls || [],
          fact,
        });
        sounds.push(wave.chain >= 3 ? "deploy" : wave.cells.length >= 4 ? "squash" : "clear");
      });
      state.message =
        waves.length > 1
          ? `Cascade ×${waves.length} — ${state.pendingFact ? state.pendingFact.loc : 0}+ LOC shipped.`
          : `Wrote code — ${waves[0].cells.length} gems cleared.`;
      let leveled = false;
      if (state.levelScore >= state.goal) {
        if (state.level >= CURRICULUM.length) {
          state.status = "over";
          state.message = "Senior developer unlocked — you finished the path.";
          grantLessonSkill(state.level);
          sounds.push("level");
          leveled = true;
        } else {
          state.level += 1;
          state.levelScore = 0;
          state.goal = goalForLevel(state.level);
          state.moves += Math.min(8, 4 + Math.floor(state.level / 3));
          state.hints = Math.min(3, state.hints + 1);
          state.shuffles = Math.min(3, state.shuffles + 1);
          state.levelFlash = now();
          const lesson = lessonFor(state.level);
          state.message = `Lesson ${state.level}: ${lesson.title} (${lesson.rank})`;
          pushLog(`lesson → ${lesson.title}`);
          grantLessonSkill(state.level);
          sounds.push("level");
          state.board = fillBoardNoMatches(random, state.level);
          leveled = true;
        }
      }
      const badges = unlockAchievements();
      if (badges.length) sounds.push("badge");
      return { sounds, badges, fact, leveled };
    }

    function afterResolveCheck() {
      if (!hasValidMoves(state.board)) {
        if (state.shuffles > 0) {
          state.message = "No moves — auto-shuffling the board.";
          doShuffle(true);
        } else if (state.moves <= 0) {
          state.status = "over";
          state.message = "No moves left — rebase to try again.";
        } else {
          state.message = "No moves — use Shuffle or keep hunting.";
        }
      }
      if (state.moves <= 0 && state.status === "playing" && state.levelScore < state.goal) {
        state.status = "over";
        state.message = "Out of moves — rebase to try again.";
      }
    }

    function trySwap(a, b) {
      if (state.status !== "playing" || state.busy) return { ok: false };
      if (!a || !b || !areAdjacent(a, b)) return { ok: false };
      if (!inBounds(a.x, a.y) || !inBounds(b.x, b.y)) return { ok: false };

      const swapped = swapCells(state.board, a, b);
      if (!boardHasMatch(swapped)) {
        state.fx.push({ id: `bounce-${now()}`, at: now(), type: "bounce", a, b });
        return { ok: false, bounce: true, sounds: ["move"] };
      }

      state.board = swapped;
      state.moves -= 1;
      state.selected = null;
      state.hint = null;
      state.busy = true;
      const resolved = resolveBoard(state.board, random, state.level);
      state.board = resolved.board;
      const outcome = applyWaves(resolved.waves);
      state.busy = false;
      afterResolveCheck();
      state.fx.push({ id: `swap-${now()}`, at: now(), type: "swap", a, b });
      return { ok: true, waves: resolved.waves, sounds: ["rotate"].concat(outcome.sounds || []) };
    }

    function selectCell(x, y) {
      if (state.status !== "playing" || state.busy || !inBounds(x, y)) return null;
      const cell = { x, y };
      if (!state.selected) {
        state.selected = cell;
        return { selected: cell };
      }
      if (state.selected.x === x && state.selected.y === y) {
        state.selected = null;
        return { selected: null };
      }
      if (areAdjacent(state.selected, cell)) {
        const a = state.selected;
        state.selected = null;
        return trySwap(a, cell);
      }
      state.selected = cell;
      return { selected: cell };
    }

    function doHint() {
      if (state.status !== "playing" || state.hints < 1) return false;
      const hint = findHint(state.board);
      if (!hint) return false;
      state.hints -= 1;
      state.hintsUsed += 1;
      state.hint = hint;
      state.message = "Hint lit — swap the glowing gems.";
      unlockAchievements();
      return true;
    }

    function doShuffle(free) {
      if (state.status !== "playing") return false;
      if (!free) {
        if (state.shuffles < 1) return false;
        state.shuffles -= 1;
        state.shufflesUsed += 1;
      }
      state.board = fillBoardNoMatches(random, state.level);
      state.selected = null;
      state.hint = null;
      state.message = "Board reshuffled.";
      pushLog("shuffle: redeployed gem grid");
      state.fx.push({ id: `shuffle-${now()}`, at: now(), type: "shuffle" });
      unlockAchievements();
      return true;
    }

    function play() {
      if (state.status === "playing") return;
      if (state.status === "over") reset();
      state.status = "playing";
      const lesson = lessonFor(state.level);
      state.message = `Lesson ${state.level}: ${lesson.title} — write ${state.goal} LOC to advance.`;
      state.levelFlash = now();
      grantLessonSkill(state.level);
    }

    function pause() {
      if (state.status !== "playing") return;
      state.status = "paused";
      state.message = "Working tree paused.";
    }

    function resume() {
      if (state.status !== "paused") return;
      state.status = "playing";
      state.message = "Back on the main branch.";
    }

    function reset() {
      state.board = fillBoardNoMatches(random, 1);
      state.linesOfCode = 0;
      state.score = 0;
      state.level = 1;
      state.levelScore = 0;
      state.goal = goalForLevel(1);
      state.moves = movesForLevel(1);
      state.matches = 0;
      state.cleared = 0;
      state.combo = 0;
      state.maxCombo = 0;
      state.maxChain = 0;
      state.quads = 0;
      state.hints = 2;
      state.shuffles = 2;
      state.hintsUsed = 0;
      state.shufflesUsed = 0;
      state.achievements = {};
      state.skills = {};
      state.lastFact = null;
      state.pendingFact = null;
      state.skillUnlock = null;
      state.commitLog = [];
      state.fx = [];
      state.status = "ready";
      state.message = "Lesson 1 — HTML bones. Swap gems to write your first lines of code.";
      state.selected = null;
      state.hint = null;
      state.levelFlash = 0;
      state.busy = false;
    }

    function consumeFx() {
      const fresh = state.fx.slice();
      state.fx = [];
      return fresh;
    }

    function consumeFact() {
      const fact = state.pendingFact;
      state.pendingFact = null;
      return fact;
    }

    function consumeSkillUnlock() {
      const skill = state.skillUnlock;
      state.skillUnlock = null;
      return skill;
    }

    function snapshot() {
      const lesson = lessonFor(state.level);
      return {
        board: cloneBoard(state.board),
        linesOfCode: state.linesOfCode,
        score: state.linesOfCode,
        level: state.level,
        levelScore: state.levelScore,
        goal: state.goal,
        moves: state.moves,
        matches: state.matches,
        cleared: state.cleared,
        combo: state.combo,
        maxCombo: state.maxCombo,
        maxChain: state.maxChain,
        quads: state.quads,
        hints: state.hints,
        shuffles: state.shuffles,
        sprint: lesson.title,
        lessonTitle: lesson.title,
        lessonTrack: lesson.track,
        lessonRank: lesson.rank,
        lessonSkill: lesson.skill,
        skills: Object.values(state.skills),
        lastFact: state.lastFact,
        pendingFact: state.pendingFact,
        skillUnlock: state.skillUnlock,
        commitLog: state.commitLog.slice(),
        achievements: Object.keys(state.achievements),
        status: state.status,
        message: state.message,
        selected: state.selected ? { ...state.selected } : null,
        hint: state.hint
          ? { a: { ...state.hint.a }, b: { ...state.hint.b } }
          : null,
        levelFlash: state.levelFlash,
        busy: state.busy,
        curriculumLength: CURRICULUM.length,
      };
    }

    return {
      COLS,
      ROWS,
      SIZE,
      play,
      pause,
      resume,
      reset,
      selectCell,
      trySwap,
      hint: doHint,
      shuffle: doShuffle,
      consumeFx,
      consumeFact,
      consumeSkillUnlock,
      snapshot,
      findMatches: () => findMatches(state.board),
      get status() {
        return state.status;
      },
      get score() {
        return state.linesOfCode;
      },
      get linesOfCode() {
        return state.linesOfCode;
      },
    };
  }

  const STORAGE = {
    high: "git-blocks-high-score",
    prefs: "git-blocks-prefs-v2",
  };

  const BG_PRESETS = [
    {
      id: "navy",
      label: "Navy",
      pattern: "drift",
      css: "radial-gradient(900px 420px at 8% -8%, rgba(79,143,212,.22), transparent 55%), radial-gradient(700px 360px at 100% 0%, rgba(13,46,87,.55), transparent 48%), #0b1220",
    },
    {
      id: "solid-ink",
      label: "Ink",
      pattern: "rise",
      css: "#0b1220",
    },
    {
      id: "aurora",
      label: "Aurora",
      pattern: "orbit",
      css: "radial-gradient(circle at 20% 20%, rgba(61,139,110,.4), transparent 40%), radial-gradient(circle at 80% 0%, rgba(139,124,224,.35), transparent 42%), #0a1220",
    },
    {
      id: "terminal",
      label: "Term",
      pattern: "rise",
      css: "radial-gradient(circle at 30% 20%, rgba(61,139,110,.35), transparent 40%), #07140f",
    },
    {
      id: "ember",
      label: "Ember",
      pattern: "sway",
      css: "radial-gradient(circle at 70% 10%, rgba(224,138,74,.35), transparent 45%), #1a0f0c",
    },
  ];

  const DEV_CLOUD_WORDS = {
    css: ["flex", "grid", "clamp()", ":root", "var(--navy)", "@media", "gap", "aspect-ratio", "::before", "container"],
    php: ["foreach", "namespace", "??=", "match()", "PDO", "Composer", "strict_types", "yield", "enum", "readonly"],
    wordpress: ["add_action", "WP_Query", "the_content", "block.json", "get_posts", "shortcode", "hooks", "REST"],
    react: ["useState", "useEffect", "JSX", "props", "memo", "Suspense", "useRef", "Fragment", "hooks"],
    general: ["git merge", "CI", "API", "GraphQL", "TypeScript", "PR", "lint", "deploy", "a11y", "npm"],
  };

  const WordGenerator = (function createWordGenerator() {
    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const LOWER = "abcdefghijklmnopqrstuvwxyz";
    const DIGITS = "0123456789";
    const LANGS = ["css", "php", "wordpress", "react", "general"];
    const PREFIXES = ["git", "npm", "wp", "css", "js", "ts", "api", "ci", "dev", "web"];
    const SUFFIXES = ["fix", "ship", "merge", "build", "lint", "test", "hook", "sync", "diff", "push"];

    function pick(list, random) {
      const rnd = random || Math.random;
      return list[Math.floor(rnd() * list.length)];
    }

    function randomLetters(len, random) {
      const rnd = random || Math.random;
      const n = Math.max(1, Math.min(12, len || 2 + Math.floor(rnd() * 4)));
      let out = "";
      for (let i = 0; i < n; i += 1) {
        const pool = i === 0 ? LETTERS : rnd() > 0.35 ? LOWER : LETTERS;
        out += pool[Math.floor(rnd() * pool.length)];
      }
      return out;
    }

    function randomHexToken(random) {
      const rnd = random || Math.random;
      const n = 3 + Math.floor(rnd() * 4);
      let out = "#";
      for (let i = 0; i < n; i += 1) out += "0123456789abcdef"[Math.floor(rnd() * 16)];
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
      return { text: pick(pool, rnd), lang: lang === "wordpress" ? "wp" : lang === "general" ? "dev" : lang };
    }

    function nextCloudToken(random) {
      const rnd = random || Math.random;
      const roll = rnd();
      if (roll < 0.28) return { text: randomLetters(2 + Math.floor(rnd() * 5), rnd), lang: "dev" };
      if (roll < 0.4) return { text: randomHexToken(rnd), lang: "css" };
      if (roll < 0.52) return { text: randomDevCompound(rnd), lang: "dev" };
      if (roll < 0.6) {
        const a = LETTERS[Math.floor(rnd() * 26)];
        const b = DIGITS[Math.floor(rnd() * 10)];
        return { text: `${a}${b}${randomLetters(2, rnd)}`, lang: "dev" };
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
      randomLetters,
      randomHexToken,
      randomDevCompound,
      randomDevWord,
      nextCloudToken,
      generateCloud,
    };
  })();

  function resolveGameAsset(relativePath) {
    if (typeof document === "undefined") return relativePath;
    const el =
      (typeof document.currentScript !== "undefined" && document.currentScript) ||
      document.querySelector('script[src*="git-blocks.js"]');
    if (!el || !el.src) return relativePath;
    try {
      const base = el.src.replace(/[^/]+$/, "");
      if (/\/js\/$/i.test(base)) return new URL(`../${relativePath}`, base).href;
      return new URL(relativePath, base).href;
    } catch (_err) {
      return relativePath;
    }
  }

  const OPEN_SOURCE_POOL = [
    { id: "chip", label: "Chip commit", kind: "generated", style: "chip", credit: "Procedural chip loop — MIT, in-browser." },
    { id: "pad", label: "Soft backlog pad", kind: "generated", style: "pad", credit: "Procedural pad loop — MIT, in-browser." },
    { id: "pulse", label: "Merge pulse", kind: "generated", style: "pulse", credit: "Procedural pulse loop — MIT, in-browser." },
    { id: "arcade", label: "Arcade rebase", kind: "generated", style: "arcade", credit: "Procedural arcade loop — MIT, in-browser." },
    { id: "ambient", label: "Idle deploy hum", kind: "generated", style: "ambient", credit: "Procedural ambient hum — MIT, in-browser." },
    { id: "glitch", label: "Hotfix glitch", kind: "generated", style: "glitch", credit: "Procedural glitch loop — MIT, in-browser." },
  ];

  const THEME_TRACK = {
    id: "stack-sprint",
    label: "Stack sprint theme",
    kind: "url",
    url: resolveGameAsset("audio/stack-sprint.ogg"),
    credit: "Original chiptune — generated for Git Blocks (MIT). Auto-plays when a sprint starts.",
  };

  const MUSIC_TRACKS_BASE = [
    { id: "off", label: "Music off", kind: "off", credit: "Silence — focus mode." },
    THEME_TRACK,
    { id: "custom", label: "Custom open-source URL…", kind: "custom", credit: "Paste a CC0 / CC-BY MP3 or OGG URL you have rights to stream." },
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
    MUSIC_TRACKS = [MUSIC_TRACKS_BASE[0], THEME_TRACK].concat(picked, MUSIC_TRACKS_BASE.slice(2));
    THEME_TRACK.url = resolveGameAsset("audio/stack-sprint.ogg");
    return MUSIC_TRACKS;
  }

  discoverFreeTracks(5);

  function defaultPrefs() {
    return {
      background: { mode: "preset", presetId: "navy", css: BG_PRESETS[0].css, image: "" },
      music: { trackId: "stack-sprint", customUrl: "", volume: 0.38 },
      graphics: "advanced",
    };
  }

  function loadPrefs() {
    const base = defaultPrefs();
    try {
      const raw = localStorage.getItem(STORAGE.prefs);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      return {
        background: Object.assign({}, base.background, parsed.background || {}),
        music: Object.assign({}, base.music, parsed.music || {}),
        graphics: parsed.graphics === "simple" ? "simple" : "advanced",
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

  function randomGradient() {
    const hues = [
      Math.floor(Math.random() * 360),
      Math.floor(Math.random() * 360),
      Math.floor(Math.random() * 360),
    ];
    return `linear-gradient(${120 + Math.floor(Math.random() * 80)}deg, hsl(${hues[0]} 42% 14%), hsl(${hues[1]} 48% 22%) 55%, hsl(${hues[2]} 40% 10%))`;
  }

  function prefersReducedMotion() {
    return Boolean(typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
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

  function gemPath(ctx, cx, cy, r) {
    // Faceted jewel silhouette (octagon-ish diamond)
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r * 0.72, cy - r * 0.35);
    ctx.lineTo(cx + r * 0.72, cy + r * 0.35);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r * 0.72, cy + r * 0.35);
    ctx.lineTo(cx - r * 0.72, cy - r * 0.35);
    ctx.closePath();
  }

  function drawLogoMark(ctx, mark, cx, cy, size, ink) {
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(1.2, size * 0.07);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const s = size * 0.28;

    if (mark === "html") {
      ctx.font = `700 ${Math.floor(size * 0.28)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("</>", cx, cy + 1);
    } else if (mark === "css") {
      ctx.font = `700 ${Math.floor(size * 0.32)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("#", cx, cy + 1);
    } else if (mark === "js") {
      ctx.font = `800 ${Math.floor(size * 0.34)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("JS", cx, cy + 1);
    } else if (mark === "ts") {
      ctx.font = `800 ${Math.floor(size * 0.34)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TS", cx, cy + 1);
    } else if (mark === "react") {
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 1.35, s * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 1.35, s * 0.55, Math.PI / 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * 1.35, s * 0.55, -Math.PI / 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else if (mark === "php") {
      ctx.font = `700 ${Math.floor(size * 0.26)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PHP", cx, cy + 1);
    } else if (mark === "wp") {
      ctx.beginPath();
      ctx.arc(cx, cy, s * 1.05, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = `700 ${Math.floor(size * 0.28)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("W", cx, cy + 1);
    } else if (mark === "git") {
      // branching nodes
      ctx.beginPath();
      ctx.arc(cx - s * 0.55, cy + s * 0.55, s * 0.28, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.55, cy - s * 0.55, s * 0.28, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.55, cy + s * 0.55, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.55, cy + s * 0.55);
      ctx.lineTo(cx + s * 0.55, cy + s * 0.55);
      ctx.lineTo(cx + s * 0.55, cy - s * 0.55);
      ctx.stroke();
    } else if (mark === "node") {
      // hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const ang = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + Math.cos(ang) * s * 1.15;
        const py = cy + Math.sin(ang) * s * 1.15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.font = `700 ${Math.floor(size * 0.22)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("n", cx, cy + 1);
    } else if (mark === "npm") {
      roundedRect(ctx, cx - s * 1.1, cy - s * 0.7, s * 2.2, s * 1.4, 2);
      ctx.stroke();
      ctx.font = `800 ${Math.floor(size * 0.22)}px "IBM Plex Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("npm", cx, cy + 1);
    }
  }

  function drawGem(ctx, x, y, size, kind, opts) {
    const o = opts || {};
    const meta = META[kind];
    if (!meta) return;
    const advanced = o.advanced !== false;
    const pulse = o.pulse || 0;
    const selected = Boolean(o.selected);
    const hinted = Boolean(o.hinted);
    const scale = o.scale == null ? 1 : o.scale;
    const alpha = o.alpha == null ? 1 : o.alpha;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = (size * 0.38) * scale;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (advanced) {
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      gemPath(ctx, cx + 1.5, cy + 2.5, r);
      ctx.fill();
    }

    if (pulse > 0 || selected || hinted) {
      ctx.shadowColor = meta.accent;
      ctx.shadowBlur = size * (0.35 + pulse * 0.55 + (selected ? 0.25 : 0));
    }

    const body = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    body.addColorStop(0, meta.accent);
    body.addColorStop(0.45, meta.color);
    body.addColorStop(1, shade(meta.color, -35));
    gemPath(ctx, cx, cy, r);
    ctx.fillStyle = body;
    ctx.fill();

    if (advanced) {
      // facet lines
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.moveTo(cx - r * 0.72, cy - r * 0.35);
      ctx.lineTo(cx + r * 0.72, cy + r * 0.35);
      ctx.moveTo(cx + r * 0.72, cy - r * 0.35);
      ctx.lineTo(cx - r * 0.72, cy + r * 0.35);
      ctx.stroke();

      // specular
      const shine = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.45, 1, cx - r * 0.2, cy - r * 0.3, r * 0.9);
      shine.addColorStop(0, "rgba(255,255,255,0.65)");
      shine.addColorStop(0.35, "rgba(255,255,255,0.18)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      gemPath(ctx, cx, cy, r);
      ctx.fillStyle = shine;
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = Math.max(1, size * 0.03);
      gemPath(ctx, cx, cy, r);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    drawLogoMark(ctx, meta.mark, cx, cy + size * 0.02, size * scale, meta.ink || "#fff");

    if (selected) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.max(2, size * 0.05);
      roundedRect(ctx, x + size * 0.06, y + size * 0.06, size * 0.88, size * 0.88, size * 0.16);
      ctx.stroke();
    }
    if (hinted && !selected) {
      ctx.strokeStyle = meta.accent;
      ctx.lineWidth = Math.max(2, size * 0.045);
      ctx.setLineDash([4, 3]);
      roundedRect(ctx, x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84, size * 0.16);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function shade(hex, amt) {
    const n = hex.replace("#", "");
    const num = parseInt(n.length === 3 ? n.split("").map((c) => c + c).join("") : n, 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0xff) + amt;
    let b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  function createSfxEngine() {
    let audioCtx = null;
    function ctx() {
      if (typeof AudioContext === "undefined") return null;
      audioCtx = audioCtx || new AudioContext();
      return audioCtx;
    }
    function tone(freq, dur, type, gainVal, slide) {
      const ac = ctx();
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const t = ac.currentTime;
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      gain.gain.setValueAtTime(gainVal || 0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
    function play(kind) {
      try {
        if (kind === "move") tone(420, 0.06, "square", 0.03);
        else if (kind === "rotate") {
          tone(560, 0.07, "triangle", 0.04);
          tone(720, 0.08, "triangle", 0.025, 900);
        } else if (kind === "clear") {
          tone(520, 0.1, "triangle", 0.05);
          tone(780, 0.14, "triangle", 0.04, 980);
        } else if (kind === "squash") {
          tone(360, 0.09, "square", 0.045, 280);
          tone(640, 0.12, "triangle", 0.04);
        } else if (kind === "deploy") {
          [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.16, "triangle", 0.05), i * 70));
        } else if (kind === "level") {
          tone(440, 0.12, "square", 0.04);
          setTimeout(() => tone(660, 0.16, "square", 0.045), 90);
          setTimeout(() => tone(880, 0.2, "triangle", 0.05), 180);
        } else if (kind === "badge") {
          tone(880, 0.1, "sine", 0.04);
          setTimeout(() => tone(1320, 0.14, "sine", 0.035), 80);
        } else if (kind === "start") {
          tone(392, 0.1, "triangle", 0.04);
          setTimeout(() => tone(523, 0.14, "triangle", 0.045), 90);
        } else tone(440, 0.08, "square", 0.03);
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
    let style = "chip";
    let playing = false;
    let volume = 0.35;
    let htmlAudio = null;
    let previewTimer = 0;

    function ensure() {
      if (typeof AudioContext === "undefined") return null;
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
          /* */
        }
        try {
          n.disconnect();
        } catch (_e2) {
          /* */
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
        htmlAudio.src = "";
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
      const t = ctx.currentTime;
      [196, 247, 294, 392, 294, 247].forEach((freq, i) => blip(ctx, freq, "square", t + i * 0.22, 0.18, 0.05));
    }

    function runStyle(ctx) {
      if (style === "pad") {
        const now = ctx.currentTime;
        [130.81, 164.81, 196].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
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
      } else if (style === "arcade") {
        const now = ctx.currentTime;
        [262, 330, 392, 523, 392, 330, 294, 262].forEach((freq, i) => blip(ctx, freq, "square", now + i * 0.14, 0.12, 0.045));
      } else if (style === "pulse") {
        const now = ctx.currentTime;
        for (let i = 0; i < 4; i += 1) blip(ctx, i % 2 === 0 ? 98 : 147, "triangle", now + i * 0.35, 0.28, 0.06);
      } else if (style === "ambient") {
        const now = ctx.currentTime;
        [110, 138.59, 164.81].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.value = 0.018 - i * 0.003;
          osc.connect(gain);
          gain.connect(master);
          osc.start(now);
          osc.stop(now + 3.2);
          nodes.push(osc);
        });
      } else if (style === "glitch") {
        const now = ctx.currentTime;
        for (let i = 0; i < 10; i += 1) {
          blip(ctx, 180 + Math.random() * 640, Math.random() > 0.5 ? "sawtooth" : "square", now + i * 0.09, 0.06, 0.035);
        }
      } else scheduleChip(ctx);
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
      timer = setInterval(beat, style === "pad" || style === "ambient" ? 2800 : style === "arcade" ? 1200 : 1400);
      return true;
    }

    function startUrl(url) {
      stopAll();
      if (!url) return false;
      htmlAudio = new Audio(url);
      htmlAudio.loop = true;
      htmlAudio.volume = volume;
      htmlAudio.play().catch(() => startGenerated("ambient"));
      playing = true;
      return true;
    }

    function previewGenerated(nextStyle, ms) {
      const ctx = ensure();
      if (!ctx) return false;
      const wasPlaying = playing;
      const prevStyle = style;
      stopGenerated();
      style = nextStyle || "chip";
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

    return {
      setVolume,
      stop: stopAll,
      playGenerated: startGenerated,
      playUrl: startUrl,
      previewGenerated,
      get playing() {
        return playing;
      },
    };
  }

  function patternForBackground(bg) {
    if (bg.mode === "preset") {
      const preset = BG_PRESETS.find((p) => p.id === bg.presetId);
      return (preset && preset.pattern) || "drift";
    }
    if (bg.mode === "image") return "sway";
    return "orbit";
  }

  function mountDevClouds(host, pattern, level) {
    if (!host) return;
    const lesson = lessonFor(level || 1);
    const themed = (lesson.clouds || []).map((text) => ({
      text,
      lang: lesson.id.includes("css") || lesson.id.includes("layout") || lesson.id.includes("responsive")
        ? "css"
        : lesson.id.includes("php") || lesson.id.includes("wp")
          ? "wp"
          : lesson.id.includes("react") || lesson.id.includes("hooks")
            ? "react"
            : lesson.id.includes("js") || lesson.id.includes("dom") || lesson.id.includes("typescript")
              ? "dev"
              : "dev",
    }));
    const filler = WordGenerator.generateCloud(Math.max(8, 28 - themed.length));
    const tokens = themed.concat(filler).slice(0, 28);
    host.className = `dev-clouds pattern-${pattern || "drift"}`;
    host.setAttribute("data-dev-clouds", "");
    host.setAttribute("aria-hidden", "true");
    host.replaceChildren();
    tokens.forEach((token, index) => {
      const span = document.createElement("span");
      span.className = "dev-cloud";
      span.textContent = token.text;
      const col = index % 7;
      const row = Math.floor(index / 7);
      span.style.left = `${4 + col * 13 + Math.random() * 6}%`;
      span.style.top = `${8 + row * 18 + Math.random() * 8}%`;
      span.style.animationDelay = `${(-Math.random() * 18).toFixed(2)}s`;
      span.style.animationDuration = `${12 + Math.random() * 16}s`;
      span.style.fontSize = `${0.65 + Math.random() * 0.75}rem`;
      span.style.opacity = String(0.22 + Math.random() * 0.4);
      span.dataset.lang = token.lang || "dev";
      host.appendChild(span);
    });
  }

  function refreshDevCloudText(doc, level) {
    const rootDoc = doc || (typeof document !== "undefined" ? document : null);
    if (!rootDoc) return;
    const lesson = lessonFor(level || 1);
    const pool = (lesson.clouds || []).slice();
    rootDoc.querySelectorAll("[data-dev-clouds] .dev-cloud").forEach((el, i) => {
      if (pool.length && Math.random() < 0.65) {
        el.textContent = pool[i % pool.length];
        el.dataset.lang = "dev";
      } else {
        const token = WordGenerator.nextCloudToken();
        el.textContent = token.text;
        el.dataset.lang = token.lang || "dev";
      }
    });
  }

  function ensureDevCloudHost(rootEl) {
    if (!rootEl || !rootEl.querySelector) return document.querySelector("[data-dev-clouds]");
    let host = rootEl.querySelector("[data-dev-clouds]");
    if (host) return host;
    const boardWrap = rootEl.querySelector(".board-wrap");
    if (boardWrap) {
      host = document.createElement("div");
      host.setAttribute("data-dev-clouds", "");
      host.setAttribute("aria-hidden", "true");
      boardWrap.insertBefore(host, boardWrap.firstChild);
      return host;
    }
    return document.querySelector("[data-dev-clouds]");
  }

  function applyBackground(bg, rootEl) {
    const target = document.documentElement;
    let value = bg.css || BG_PRESETS[0].css;
    if (bg.mode === "image" && bg.image) {
      value = `linear-gradient(rgba(7,17,31,.55), rgba(7,17,31,.72)), url("${bg.image.replace(/"/g, "")}") center / cover no-repeat fixed`;
    } else if (bg.mode === "css" && bg.css) {
      value = bg.css;
    } else if (bg.mode === "preset") {
      const preset = BG_PRESETS.find((p) => p.id === bg.presetId) || BG_PRESETS[0];
      value = preset.css;
      bg.css = preset.css;
    }
    target.style.setProperty("--gb-backdrop", value);
    const pattern = patternForBackground(bg);
    target.dataset.gbPattern = pattern;
    if (rootEl && rootEl.closest) {
      const embed = rootEl.closest(".git-blocks-embed");
      if (embed) {
        embed.style.setProperty("--gb-backdrop", value);
        embed.dataset.gbPattern = pattern;
      }
      mountDevClouds(ensureDevCloudHost(rootEl), pattern, (rootEl && rootEl._gbLevel) || 1);
    }
  }

  function readConfig() {
    const cfg = (typeof window !== "undefined" && window.GitBlocksConfig) || {};
    return {
      shareUrl:
        cfg.shareUrl ||
        (typeof location !== "undefined" ? `${location.origin}${location.pathname}` : "https://matthummel.com/git-blocks/"),
      autoStart: cfg.autoStart === true,
      layout: cfg.layout || "viewport",
    };
  }

  function encodeShareHash(prefs, includePrefs) {
    if (!includePrefs) return "";
    const payload = {
      bg: prefs.background,
      music: { trackId: prefs.music.trackId, customUrl: prefs.music.customUrl, volume: prefs.music.volume },
    };
    try {
      return `#gb=${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`;
    } catch (_err) {
      return "";
    }
  }

  function decodeShareHash() {
    if (typeof location === "undefined") return null;
    const m = location.hash.match(/#gb=([^&]+)/);
    if (!m) return null;
    try {
      return JSON.parse(decodeURIComponent(escape(atob(m[1]))));
    } catch (_err) {
      return null;
    }
  }

  function boot(root, options) {
    if (!root || typeof document === "undefined") return null;
    const canvas = root.querySelector("[data-board]");
    if (!canvas) return null;

    const cfg = Object.assign({}, readConfig(), options || {});
    const prefs = loadPrefs();
    const shared = decodeShareHash();
    if (shared) {
      if (shared.bg) prefs.background = Object.assign({}, prefs.background, shared.bg);
      if (shared.music) prefs.music = Object.assign({}, prefs.music, shared.music);
    }

    const overlay = root.querySelector("[data-overlay]");
    const overlayTitle = root.querySelector("[data-overlay-title]");
    const overlayBody = root.querySelector("[data-overlay-body]");
    const overlayLevel = root.querySelector("[data-overlay-level]");
    const playBtn = root.querySelector("[data-play]");
    const messageEl = root.querySelector("[data-message]");
    const scoreEl = root.querySelector("[data-score]");
    const linesEl = root.querySelector("[data-lines]");
    const levelEl = root.querySelector("[data-level]");
    const highEl = root.querySelector("[data-high]");
    const liveEl = root.querySelector("[data-live]");
    const muteBtn = root.querySelector("[data-mute]");
    const pauseBtn = root.querySelector("[data-pause]");
    const customizeBtn = root.querySelector("[data-customize]");
    const shareBtn = root.querySelector("[data-share]");
    const panel = root.querySelector("[data-customize-panel]");

    let high = 0;
    try {
      high = Number(localStorage.getItem(STORAGE.high) || 0);
    } catch (_err) {
      high = 0;
    }

    const game = createGame({ reducedMotion: prefersReducedMotion() });
    const ctx = canvas.getContext("2d");
    const music = createMusicEngine();
    const sfx = createSfxEngine();
    let muted = false;
    let raf = 0;
    let lastLevelShown = 1;
    let autoStarted = false;
    const particles = [];
    let flashCells = [];
    let anims = [];
    let sparkle = 0;

    applyBackground(prefs.background, root);
    music.setVolume(prefs.music.volume || 0.35);
    root.classList.toggle("gfx-simple", prefs.graphics === "simple");
    root._gbLevel = 1;

    if (!prefersReducedMotion()) {
      window.setInterval(() => refreshDevCloudText(root.ownerDocument, root._gbLevel || 1), 4200);
    }

    function beep(kind) {
      if (muted) return;
      sfx.play(kind);
    }

    function announce(text) {
      if (liveEl) liveEl.textContent = text;
    }

    function showFactToast(payload) {
      if (!payload) return;
      let toast = root.querySelector("[data-fact-toast]");
      if (!toast) {
        toast = document.createElement("div");
        toast.className = "fact-toast";
        toast.setAttribute("data-fact-toast", "");
        toast.setAttribute("role", "status");
        const boardWrap = root.querySelector(".board-wrap") || root;
        boardWrap.appendChild(toast);
      }
      toast.innerHTML = "";
      const kicker = document.createElement("p");
      kicker.className = "fact-kicker";
      kicker.textContent = `${payload.track || "Lesson"} · ${payload.lesson || ""} · +${payload.loc || 0} LOC`;
      const body = document.createElement("p");
      body.className = "fact-body";
      body.textContent = payload.fact || "";
      toast.append(kicker, body);
      toast.classList.add("is-visible");
      window.clearTimeout(showFactToast._timer);
      showFactToast._timer = window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
    }

    function showSkillUnlock(skill) {
      if (!skill) return;
      let banner = root.querySelector("[data-skill-unlock]");
      if (!banner) {
        banner = document.createElement("div");
        banner.className = "skill-unlock";
        banner.setAttribute("data-skill-unlock", "");
        banner.setAttribute("role", "status");
        const boardWrap = root.querySelector(".board-wrap") || root;
        boardWrap.appendChild(banner);
      }
      banner.innerHTML = "";
      const icon = document.createElement("span");
      icon.className = "skill-unlock-icon";
      icon.textContent = skill.icon || "★";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = `Skill unlocked — ${skill.name}`;
      const blurb = document.createElement("p");
      blurb.textContent = skill.blurb || skill.lesson || "";
      copy.append(title, blurb);
      banner.append(icon, copy);
      banner.classList.add("is-visible");
      window.clearTimeout(showSkillUnlock._timer);
      showSkillUnlock._timer = window.setTimeout(() => banner.classList.remove("is-visible"), 3800);
    }

    function paintSkills(skills) {
      const host = root.querySelector("[data-skills]");
      if (!host) return;
      host.replaceChildren();
      (skills || []).forEach((skill) => {
        const chip = document.createElement("span");
        chip.className = "skill-chip";
        chip.title = skill.blurb || skill.name;
        chip.innerHTML = `<em>${skill.icon || "★"}</em> ${skill.name}`;
        host.appendChild(chip);
      });
    }

    function syncLessonClouds(level) {
      root._gbLevel = level || 1;
      const pattern = patternForBackground(prefs.background);
      mountDevClouds(ensureDevCloudHost(root), pattern, root._gbLevel);
    }

    function spawnBurst(cells, cellSize) {
      if (prefersReducedMotion()) return;
      cells.forEach((cell) => {
        const color = (META[cell.kind] && META[cell.kind].accent) || "#8ec8ff";
        for (let i = 0; i < 10; i += 1) {
          particles.push({
            x: (cell.x + 0.5) * cellSize,
            y: (cell.y + 0.5) * cellSize,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.8) * 6,
            life: 1,
            color,
            size: 2 + Math.random() * 3.5,
          });
        }
      });
    }

    function ingestFx(fxList, cellSize) {
      fxList.forEach((fx) => {
        if (fx.type === "match" && fx.cells) {
          flashCells = fx.cells.map((c) => ({ ...c, until: Date.now() + 320 }));
          spawnBurst(fx.cells, cellSize);
          anims.push({ type: "pulse", at: Date.now(), cells: fx.cells });
        }
        if (fx.type === "bounce") {
          anims.push({ type: "bounce", at: Date.now(), a: fx.a, b: fx.b });
        }
        if (fx.type === "shuffle") {
          anims.push({ type: "shuffle", at: Date.now() });
        }
      });
    }

    function sizeCanvas() {
      const wrap = canvas.parentElement;
      const availW = Math.max(120, wrap.clientWidth - 16);
      const availH = Math.max(160, wrap.clientHeight - 16);
      const cell = Math.max(28, Math.min(Math.floor(availW / COLS), Math.floor(availH / ROWS)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = COLS * cell * dpr;
      canvas.height = ROWS * cell * dpr;
      canvas.style.width = `${COLS * cell}px`;
      canvas.style.height = `${ROWS * cell}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return cell;
    }

    function paintLegend() {
      const host = root.querySelector("[data-gem-legend]");
      if (!host || host.dataset.ready) return;
      host.dataset.ready = "1";
      host.replaceChildren();
      GEMS.forEach((gem) => {
        const item = document.createElement("div");
        item.className = "gem-legend-item";
        const c = document.createElement("canvas");
        c.width = 36;
        c.height = 36;
        c.setAttribute("aria-hidden", "true");
        drawGem(c.getContext("2d"), 0, 0, 36, gem.id, { advanced: true });
        const cap = document.createElement("span");
        cap.textContent = gem.label;
        item.append(c, cap);
        host.appendChild(item);
      });
    }

    function draw() {
      const cell = sizeCanvas();
      const advancedGfx = prefs.graphics !== "simple";
      const fx = game.consumeFx();
      if (fx.length) {
        ingestFx(fx, cell);
        fx.forEach((item) => {
          if (item.type === "match") {
            const big = item.chain >= 3 || (item.cells && item.cells.length >= 4);
            beep(big ? "deploy" : "clear");
          }
          if (item.type === "bounce") beep("move");
          if (item.type === "shuffle") beep("rotate");
        });
      }

      const snap = game.snapshot();
      const nowTs = Date.now();
      sparkle += 0.04;

      // board backdrop
      ctx.clearRect(0, 0, COLS * cell, ROWS * cell);
      const bg = ctx.createLinearGradient(0, 0, 0, ROWS * cell);
      bg.addColorStop(0, "rgba(10, 21, 40, 0.55)");
      bg.addColorStop(1, "rgba(5, 12, 22, 0.72)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, COLS * cell, ROWS * cell);

      // soft cell wells
      for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
          roundedRect(ctx, x * cell + 2, y * cell + 2, cell - 4, cell - 4, cell * 0.14);
          ctx.fillStyle = "rgba(255,255,255,0.03)";
          ctx.fill();
        }
      }

      flashCells = flashCells.filter((c) => c.until > nowTs);
      const flashMap = {};
      flashCells.forEach((c) => {
        flashMap[`${c.x},${c.y}`] = (c.until - nowTs) / 320;
      });

      const hintSet = {};
      if (snap.hint) {
        hintSet[`${snap.hint.a.x},${snap.hint.a.y}`] = true;
        hintSet[`${snap.hint.b.x},${snap.hint.b.y}`] = true;
      }

      // idle sparkles
      if (advancedGfx && !prefersReducedMotion()) {
        for (let i = 0; i < 6; i += 1) {
          const sx = ((Math.sin(sparkle + i * 1.7) * 0.5 + 0.5) * COLS) * cell;
          const sy = ((Math.cos(sparkle * 0.8 + i) * 0.5 + 0.5) * ROWS) * cell;
          ctx.fillStyle = `rgba(255,255,255,${0.04 + (Math.sin(sparkle + i) * 0.5 + 0.5) * 0.08})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      snap.board.forEach((row, y) => {
        row.forEach((kind, x) => {
          if (!kind) return;
          const key = `${x},${y}`;
          const selected = snap.selected && snap.selected.x === x && snap.selected.y === y;
          const pulse = flashMap[key] || (selected ? 0.25 + Math.sin(sparkle * 3) * 0.1 : 0);
          drawGem(ctx, x * cell, y * cell, cell, kind, {
            advanced: advancedGfx,
            pulse,
            selected,
            hinted: hintSet[key],
            scale: flashMap[key] ? 1 + flashMap[key] * 0.18 : selected ? 1.05 : 1,
          });
        });
      });

      // particles
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14;
        p.life -= 0.028;
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

      // HUD fields
      if (scoreEl) scoreEl.textContent = String(snap.linesOfCode != null ? snap.linesOfCode : snap.score);
      if (linesEl) linesEl.textContent = String(snap.cleared);
      if (levelEl) levelEl.textContent = String(snap.level);
      if (highEl) highEl.textContent = String(Math.max(high, snap.linesOfCode != null ? snap.linesOfCode : snap.score));
      if (messageEl) messageEl.textContent = snap.message;
      const comboEl = root.querySelector("[data-combo]");
      const movesEl = root.querySelector("[data-moves]");
      const goalEl = root.querySelector("[data-goal]");
      const sprintEl = root.querySelector("[data-sprint]");
      const rankEl = root.querySelector("[data-rank]");
      if (comboEl) comboEl.textContent = String(snap.combo);
      if (movesEl) movesEl.textContent = String(snap.moves);
      if (goalEl) goalEl.textContent = `${snap.levelScore}/${snap.goal} LOC`;
      if (sprintEl) {
        sprintEl.textContent = snap.lessonTitle
          ? `L${snap.level} · ${snap.lessonTitle}`
          : snap.sprint || "";
      }
      if (rankEl) rankEl.textContent = snap.lessonRank ? `${snap.lessonTrack} · ${snap.lessonRank}` : "";

      const fact = typeof game.consumeFact === "function" ? game.consumeFact() : null;
      if (fact) showFactToast(fact);
      const skill = typeof game.consumeSkillUnlock === "function" ? game.consumeSkillUnlock() : null;
      if (skill) {
        showSkillUnlock(skill);
        beep("badge");
      }
      paintSkills(snap.skills);
      if (root._gbLevel !== snap.level) syncLessonClouds(snap.level);

      const hintBtn = root.querySelector("[data-hint]");
      const shuffleBtn = root.querySelector("[data-shuffle]");
      if (hintBtn) {
        hintBtn.disabled = snap.status !== "playing" || snap.hints < 1;
        hintBtn.textContent = `Hint (${snap.hints})`;
      }
      if (shuffleBtn) {
        shuffleBtn.disabled = snap.status !== "playing" || snap.shuffles < 1;
        shuffleBtn.textContent = `Shuffle (${snap.shuffles})`;
      }

      const logEl = root.querySelector("[data-commit-log]");
      if (logEl) {
        logEl.replaceChildren();
        (snap.commitLog || []).slice(0, 3).forEach((line) => {
          const li = document.createElement("li");
          li.textContent = line;
          logEl.appendChild(li);
        });
      }
      const badgeEl = root.querySelector("[data-badges]");
      if (badgeEl) {
        badgeEl.replaceChildren();
        (snap.achievements || []).forEach((id) => {
          const ach = ACHIEVEMENTS.find((a) => a.id === id);
          const span = document.createElement("span");
          span.className = "badge-chip";
          span.textContent = ach ? ach.label : id;
          badgeEl.appendChild(span);
        });
      }

      paintLegend();

      const progress = root.querySelector("[data-progress]");
      if (progress) {
        const pct = Math.max(0, Math.min(100, Math.round((snap.levelScore / Math.max(1, snap.goal)) * 100)));
        progress.style.width = `${pct}%`;
        progress.parentElement && progress.parentElement.setAttribute("aria-valuenow", String(pct));
      }

      const flashAge = snap.levelFlash ? Date.now() - snap.levelFlash : 9999;
      const showLevelBanner = snap.status === "playing" && flashAge < 1100;
      const customizing = panel && !panel.hidden;
      if (overlay && overlayTitle && overlayBody) {
        const show = !customizing && (snap.status !== "playing" || showLevelBanner);
        overlay.hidden = !show;
        overlay.classList.toggle("is-clickable", !customizing && snap.status !== "playing");
        if (overlayLevel) {
          overlayLevel.hidden = !(showLevelBanner || snap.status === "ready");
          overlayLevel.textContent = snap.lessonTitle || snap.sprint || `Lesson ${snap.level}`;
        }
        if (showLevelBanner && snap.status === "playing") {
          overlayTitle.textContent = `Skill path · ${snap.lessonRank || "Next"}`;
          overlayBody.textContent = `${snap.lessonTitle}. ${
            (snap.lessonSkill && snap.lessonSkill.blurb) || "Keep matching to write more lines of code."
          }`;
          if (playBtn) playBtn.hidden = true;
        } else if (snap.status === "ready") {
          overlayTitle.textContent = "Git Blocks";
          overlayBody.textContent =
            "Learn web development from HTML to senior craft. Match shiny logo gems to write lines of code, unlock RPG skills, and graduate.";
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = "Start learning";
          }
        } else if (snap.status === "paused") {
          overlayTitle.textContent = "Paused";
          overlayBody.textContent = snap.message;
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = "Resume";
          }
        } else if (snap.status === "over") {
          const graduated = snap.level >= (snap.curriculumLength || 20);
          overlayTitle.textContent = graduated ? "Senior developer" : "Lesson paused";
          overlayBody.textContent = graduated
            ? `${snap.linesOfCode} LOC written · ${snap.skills.length} skills unlocked. You finished the path.`
            : `${snap.linesOfCode} LOC · ${snap.cleared} gems · rebase to continue studying.`;
          if (playBtn) {
            playBtn.hidden = false;
            playBtn.textContent = graduated ? "New career" : "Rebase";
          }
        }
      }

      if (snap.level !== lastLevelShown && snap.status === "playing") {
        lastLevelShown = snap.level;
        announce(`Lesson ${snap.level}: ${snap.lessonTitle}`);
        beep("level");
        syncLessonClouds(snap.level);
      }
      if (pauseBtn) {
        pauseBtn.textContent = snap.status === "paused" ? "Resume" : "Pause";
        pauseBtn.disabled = snap.status === "ready" || snap.status === "over";
      }
    }

    function persistHigh() {
      high = Math.max(high, game.score);
      try {
        localStorage.setItem(STORAGE.high, String(high));
      } catch (_err) {
        /* */
      }
    }

    function startLoop() {
      cancelAnimationFrame(raf);
      const loop = () => {
        if (game.status === "over") persistHigh();
        draw();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function playSelectedMusic() {
      THEME_TRACK.url = resolveGameAsset("audio/stack-sprint.ogg");
      const track = MUSIC_TRACKS.find((t) => t.id === prefs.music.trackId) || THEME_TRACK;
      music.setVolume(prefs.music.volume || 0.35);
      if (track.kind === "off") music.stop();
      else if (track.kind === "generated") music.playGenerated(track.style);
      else if (track.kind === "url") music.playUrl(track.url || prefs.music.customUrl || THEME_TRACK.url);
      else if (track.kind === "custom") music.playUrl(prefs.music.customUrl || THEME_TRACK.url);
    }

    function handlePlay() {
      if (game.status === "paused") game.resume();
      else {
        game.play();
        beep("start");
        announce(`Sprint ${game.snapshot().level} started`);
        if (prefs.music.trackId === "off") {
          prefs.music.trackId = "stack-sprint";
          savePrefs(prefs);
          renderMusicUi();
        }
        playSelectedMusic();
      }
      canvas.focus({ preventScroll: true });
    }

    function handlePause() {
      if (game.status === "playing") {
        game.pause();
        announce("Paused");
      } else if (game.status === "paused") game.resume();
    }

    function cellFromEvent(event) {
      const rect = canvas.getBoundingClientRect();
      const cellW = rect.width / COLS;
      const cellH = rect.height / ROWS;
      const x = Math.floor((event.clientX - rect.left) / cellW);
      const y = Math.floor((event.clientY - rect.top) / cellH);
      if (!inBounds(x, y)) return null;
      return { x, y };
    }

    let dragStart = null;

    function onPointerDown(event) {
      if (event.button !== 0) return;
      if (game.status !== "playing") {
        handlePlay();
        return;
      }
      const cell = cellFromEvent(event);
      if (!cell) return;
      dragStart = cell;
      canvas.setPointerCapture(event.pointerId);
    }

    function onPointerUp(event) {
      if (game.status !== "playing") return;
      const end = cellFromEvent(event);
      if (!dragStart) return;
      const start = dragStart;
      dragStart = null;
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (_e) {
        /* */
      }
      if (!end) return;
      if (start.x === end.x && start.y === end.y) {
        const result = game.selectCell(end.x, end.y);
        if (result && result.ok) (result.sounds || []).forEach(beep);
        else if (result && result.bounce) beep("move");
        else if (result && result.selected) beep("move");
        draw();
        return;
      }
      if (areAdjacent(start, end)) {
        const result = game.trySwap(start, end);
        if (result.ok) (result.sounds || []).forEach(beep);
        else if (result.bounce) beep("move");
        draw();
      } else {
        game.selectCell(end.x, end.y);
        draw();
      }
    }

    function onKey(event) {
      if (panel && !panel.hidden) {
        if (event.key === "Escape") closeCustomize();
        return;
      }
      if (event.key === "Enter" && game.status !== "playing") {
        event.preventDefault();
        handlePlay();
      }
      if ((event.key === "p" || event.key === "P") && (game.status === "playing" || game.status === "paused")) {
        event.preventDefault();
        handlePause();
      }
      if ((event.key === "r" || event.key === "R") && game.status === "over") {
        event.preventDefault();
        handlePlay();
      }
      if ((event.key === "h" || event.key === "H") && game.status === "playing") {
        event.preventDefault();
        if (game.hint()) beep("badge");
      }
      if ((event.key === "s" || event.key === "S") && game.status === "playing" && !event.metaKey && !event.ctrlKey) {
        // avoid stealing browser save — only when focused on canvas
        if (document.activeElement === canvas) {
          event.preventDefault();
          if (game.shuffle()) beep("rotate");
        }
      }
    }

    function openCustomize(tab) {
      if (!panel) return;
      panel.hidden = false;
      panel.removeAttribute("hidden");
      root.classList.add("is-customizing");
      switchTab(tab || "look");
      renderBgPresets();
      renderMusicUi();
      refreshShareUi();
    }

    function closeCustomize() {
      if (!panel) return;
      panel.hidden = true;
      panel.setAttribute("hidden", "");
      root.classList.remove("is-customizing");
      canvas.focus({ preventScroll: true });
    }

    function switchTab(name) {
      root.querySelectorAll("[data-tab]").forEach((btn) => {
        const on = btn.getAttribute("data-tab") === name;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      root.querySelectorAll("[data-pane]").forEach((pane) => {
        const on = pane.getAttribute("data-pane") === name;
        pane.hidden = !on;
        pane.classList.toggle("is-active", on);
      });
    }

    function renderBgPresets() {
      const host = root.querySelector("[data-bg-presets]");
      if (!host) return;
      host.replaceChildren();
      BG_PRESETS.forEach((preset) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bg-swatch" + (prefs.background.presetId === preset.id ? " is-active" : "");
        btn.style.background = preset.css;
        btn.title = preset.label;
        const cap = document.createElement("span");
        cap.textContent = preset.label;
        btn.appendChild(cap);
        btn.addEventListener("click", () => {
          prefs.background = { mode: "preset", presetId: preset.id, css: preset.css, image: "" };
          applyBackground(prefs.background, root);
          savePrefs(prefs);
          renderBgPresets();
          const cssField = root.querySelector("[data-bg-css]");
          if (cssField) cssField.value = preset.css;
        });
        host.appendChild(btn);
      });
      const cssField = root.querySelector("[data-bg-css]");
      const imgField = root.querySelector("[data-bg-image]");
      if (cssField && !cssField.dataset.bound) {
        cssField.dataset.bound = "1";
        cssField.value = prefs.background.css || "";
      }
      if (imgField && !imgField.dataset.bound) {
        imgField.dataset.bound = "1";
        imgField.value = prefs.background.image || "";
      }
      const gfx = root.querySelector("[data-graphics]");
      if (gfx && !gfx.dataset.bound) {
        gfx.dataset.bound = "1";
        gfx.value = prefs.graphics === "simple" ? "simple" : "advanced";
        gfx.addEventListener("change", () => {
          prefs.graphics = gfx.value === "simple" ? "simple" : "advanced";
          savePrefs(prefs);
          root.classList.toggle("gfx-simple", prefs.graphics === "simple");
          draw();
        });
      } else if (gfx) gfx.value = prefs.graphics === "simple" ? "simple" : "advanced";
    }

    function refillMusicSelect() {
      const select = root.querySelector("[data-music-track]");
      if (!select) return;
      const current = prefs.music.trackId;
      select.replaceChildren();
      MUSIC_TRACKS.forEach((track) => {
        const o = document.createElement("option");
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
      const select = root.querySelector("[data-music-track]");
      const credit = root.querySelector("[data-music-credit]");
      const custom = root.querySelector("[data-music-custom]");
      const volume = root.querySelector("[data-music-volume]");
      if (select && !select.dataset.bound) {
        select.dataset.bound = "1";
        select.addEventListener("change", () => {
          prefs.music.trackId = select.value;
          const meta = MUSIC_TRACKS.find((t) => t.id === select.value);
          if (credit) credit.textContent = meta ? meta.credit : "";
          savePrefs(prefs);
        });
      }
      refillMusicSelect();
      const meta = MUSIC_TRACKS.find((t) => t.id === prefs.music.trackId) || MUSIC_TRACKS[0];
      if (credit) credit.textContent = meta ? meta.credit : "";
      if (custom && !custom.dataset.bound) {
        custom.dataset.bound = "1";
        custom.value = prefs.music.customUrl || "";
        custom.addEventListener("change", () => {
          prefs.music.customUrl = custom.value.trim();
          savePrefs(prefs);
        });
      }
      if (volume && !volume.dataset.bound) {
        volume.dataset.bound = "1";
        volume.value = String(Math.round((prefs.music.volume || 0.35) * 100));
        volume.addEventListener("input", () => {
          prefs.music.volume = Number(volume.value) / 100;
          music.setVolume(prefs.music.volume);
          savePrefs(prefs);
        });
      }
    }

    function buildShareUrl() {
      const include = root.querySelector("[data-share-include-prefs]");
      const withPrefs = !include || include.checked;
      return `${cfg.shareUrl || location.href.split("#")[0]}${encodeShareHash(prefs, withPrefs)}`;
    }

    function refreshShareUi() {
      const field = root.querySelector("[data-share-url]");
      if (field) field.value = buildShareUrl();
      const x = root.querySelector("[data-share-x]");
      const li = root.querySelector("[data-share-linkedin]");
      const text = encodeURIComponent("Play Git Blocks — match shiny web-dev logo gems.");
      const url = encodeURIComponent(buildShareUrl());
      if (x) x.href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      if (li) li.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    }

    if (playBtn) playBtn.addEventListener("click", handlePlay);
    if (pauseBtn) pauseBtn.addEventListener("click", handlePause);
    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        muted = !muted;
        muteBtn.textContent = muted ? "Sound off" : "Sound on";
        muteBtn.setAttribute("aria-pressed", muted ? "true" : "false");
        if (muted) music.stop();
        else if (game.status === "playing") playSelectedMusic();
      });
    }
    if (customizeBtn) customizeBtn.addEventListener("click", () => openCustomize("look"));
    if (shareBtn) shareBtn.addEventListener("click", () => openCustomize("share"));
    root.querySelectorAll("[data-customize-close]").forEach((btn) => btn.addEventListener("click", closeCustomize));
    root.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.getAttribute("data-tab")));
    });

    const hintBtn = root.querySelector("[data-hint]");
    const shuffleBtn = root.querySelector("[data-shuffle]");
    if (hintBtn) hintBtn.addEventListener("click", () => { if (game.hint()) beep("badge"); draw(); });
    if (shuffleBtn) shuffleBtn.addEventListener("click", () => { if (game.shuffle()) beep("rotate"); draw(); });

    const bgApply = root.querySelector("[data-bg-apply]");
    const bgRandom = root.querySelector("[data-bg-random]");
    if (bgApply) {
      bgApply.addEventListener("click", () => {
        const css = (root.querySelector("[data-bg-css]") || {}).value || "";
        const image = ((root.querySelector("[data-bg-image]") || {}).value || "").trim();
        if (image) prefs.background = { mode: "image", presetId: "", css, image };
        else prefs.background = { mode: "css", presetId: "", css, image: "" };
        applyBackground(prefs.background, root);
        savePrefs(prefs);
        renderBgPresets();
      });
    }
    if (bgRandom) {
      bgRandom.addEventListener("click", () => {
        const css = randomGradient();
        prefs.background = { mode: "css", presetId: "", css, image: "" };
        const field = root.querySelector("[data-bg-css]");
        if (field) field.value = css;
        applyBackground(prefs.background, root);
        savePrefs(prefs);
        renderBgPresets();
      });
    }

    const musicApply = root.querySelector("[data-music-apply]");
    const musicStop = root.querySelector("[data-music-stop]");
    const musicPreview = root.querySelector("[data-music-preview]");
    const musicDiscover = root.querySelector("[data-music-discover]");
    if (musicApply) musicApply.addEventListener("click", playSelectedMusic);
    if (musicStop) musicStop.addEventListener("click", () => music.stop());
    if (musicPreview) {
      musicPreview.addEventListener("click", () => {
        const track = MUSIC_TRACKS.find((t) => t.id === prefs.music.trackId) || THEME_TRACK;
        if (track.kind === "generated") music.previewGenerated(track.style, 2000);
        else if (track.kind === "url" || track.kind === "custom") {
          playSelectedMusic();
          window.setTimeout(() => music.stop(), 2200);
        } else music.previewGenerated("chip", 1200);
      });
    }
    if (musicDiscover) {
      musicDiscover.addEventListener("click", () => {
        discoverFreeTracks(5);
        prefs.music.trackId = (MUSIC_TRACKS.find((t) => t.discovered) || MUSIC_TRACKS[1] || MUSIC_TRACKS[0]).id;
        savePrefs(prefs);
        renderMusicUi();
      });
    }
    root.querySelectorAll("[data-sfx-preview]").forEach((btn) => {
      btn.addEventListener("click", () => beep(btn.getAttribute("data-sfx-preview") || "move"));
    });

    const shareCopy = root.querySelector("[data-share-copy]");
    const shareNative = root.querySelector("[data-share-native]");
    const shareStatus = root.querySelector("[data-share-status]");
    const shareInclude = root.querySelector("[data-share-include-prefs]");
    if (shareInclude) shareInclude.addEventListener("change", refreshShareUi);
    if (shareCopy) {
      shareCopy.addEventListener("click", async () => {
        refreshShareUi();
        try {
          await navigator.clipboard.writeText(buildShareUrl());
          if (shareStatus) shareStatus.textContent = "Link copied.";
        } catch (_err) {
          if (shareStatus) shareStatus.textContent = "Copy failed — select the field and copy manually.";
        }
      });
    }
    if (shareNative) {
      shareNative.addEventListener("click", async () => {
        const url = buildShareUrl();
        if (navigator.share) {
          try {
            await navigator.share({ title: "Git Blocks", text: "Match shiny web-dev logo gems.", url });
            if (shareStatus) shareStatus.textContent = "Shared.";
          } catch (_err) {
            if (shareStatus) shareStatus.textContent = "Share cancelled.";
          }
        } else if (shareStatus) shareStatus.textContent = "System share unavailable — use Copy link.";
      });
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("keydown", onKey);
    window.addEventListener("keydown", onKey, { capture: true });
    window.addEventListener("resize", draw);

    renderMusicUi();
    startLoop();
    draw();

    if (cfg.autoStart && !autoStarted) {
      autoStarted = true;
      window.setTimeout(() => {
        if (game.status === "ready") handlePlay();
      }, prefersReducedMotion() ? 200 : 700);
    }

    return game;
  }

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      document.querySelectorAll("[data-git-blocks]").forEach((node) => boot(node));
    });
  }

  return {
    COLS,
    ROWS,
    SIZE,
    MATCH_MIN,
    GEMS,
    GEM_IDS,
    META,
    CURRICULUM,
    ACHIEVEMENTS,
    BG_PRESETS,
    MUSIC_TRACKS,
    DEV_CLOUD_WORDS,
    WordGenerator,
    lessonFor,
    sprintName,
    pickFact,
    goalForLevel,
    movesForLevel,
    findMatches,
    findHint,
    wouldMatch,
    hasValidMoves,
    boardHasMatch,
    swapCells,
    applyGravity,
    resolveBoard,
    fillBoardNoMatches,
    areAdjacent,
    scoreMatch,
    createGame,
    createSfxEngine,
    discoverFreeTracks,
    boot,
  };
});
