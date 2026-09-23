# Branchborne Gem Quest

**Bejeweled-style match-3. Gems of War energy. WoW-like side quests. A web-dev learning twist.**

Match tech gems, clear live side quests, collect trophies & loot, and climb from Intern to Senior — then class Expert raids.

<p align="center">
  <a href="https://matthummel-pa.github.io/matthummel-pa/"><img src="https://img.shields.io/badge/▶_Play_live-0D2E57?style=for-the-badge" alt="Play Branchborne Gem Quest" /></a>
  <a href="#wordpress-plugin"><img src="https://img.shields.io/badge/WordPress_plugin-21759B?style=for-the-badge&logo=wordpress&logoColor=white" alt="WordPress plugin" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2C5A95?style=for-the-badge" alt="MIT License" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/matthummel-pa/branchborne-gem-quest-game?style=flat-square" alt="Stars" />
  <img src="https://img.shields.io/github/forks/matthummel-pa/branchborne-gem-quest-game?style=flat-square" alt="Forks" />
  <img src="https://img.shields.io/github/issues/matthummel-pa/branchborne-gem-quest-game?style=flat-square" alt="Issues" />
  <img src="https://img.shields.io/github/license/matthummel-pa/branchborne-gem-quest-game?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/engine-vanilla_JS_canvas-4f8fd4?style=flat-square" alt="Vanilla JS canvas" />
  <img src="https://img.shields.io/badge/embed-WordPress_shortcode-777BB4?style=flat-square" alt="WordPress shortcode" />
</p>

---

## Why this game

Most “learn to code” toys feel like homework. Branchborne feels like a gem RPG:

- You **swap tech gems** (HTML, CSS, JS, React, PHP, WordPress, Git, Docker…) like Bejeweled
- **Side quests** auto-level on a live quest rail — tips stay in the quest column, not as board spam
- **Pathway classes** (Frontend Mage, Backend Sentinel, WordPress Artisan, Full-Stack Ranger) change affinity and power fantasy
- **Trophies & loot** fill a trophy case as you ship LOC toward Senior / class Expert

Built as a zero-framework canvas engine so it embeds anywhere: static Pages, WordPress, or your own site.

---

## Key features

| Feature | What you get |
|--------|----------------|
| **Continuous match-3** | Bejeweled-style cascades — no board wipe between quests |
| **14+ tech gems** | Stylized logo gems with shatter FX and affinity scoring |
| **Live side quest rail** | Available quest, LOC goal, and Dev tip beside the board |
| **Pathway heroes** | Pick a class; powers and gem affinity follow the path |
| **Trophy & loot case** | Full collection UI for earned (and locked) relics |
| **Senior → Expert endgame** | Graduate the path, then class Expert raid quests |
| **Customize & Share** | Backgrounds, music, controls, shareable look links |
| **WordPress shortcode** | Drop `[git_blocks]` (Branchborne) into any page |
| **Offline-friendly engine** | Single JS module + CSS; works in Node for unit tests |

---

## Play

| Mode | Where |
|------|--------|
| **Live demo** | [matthummel-pa.github.io/matthummel-pa](https://matthummel-pa.github.io/matthummel-pa/) |
| **Local standalone** | Open `play/index.html` or `npm start` |
| **WordPress** | Install `wordpress-plugin/` → shortcode `[git_blocks]` |

```bash
git clone https://github.com/matthummel-pa/branchborne-gem-quest-game.git
cd branchborne-gem-quest-game
npm start
# → http://127.0.0.1:8765
```

---

## Repo map

```
branchborne-gem-quest-game/
├── play/                 # Standalone cabinet (HTML + canvas engine)
│   ├── index.html
│   ├── git-blocks.js     # Engine + UI (Node-testable)
│   ├── git-blocks.css
│   └── audio/
├── wordpress-plugin/     # Embeddable WP plugin (shortcode)
├── tests/                # node:test engine suite
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── LICENSE               # MIT
```

---

## Stack

- **Runtime:** Vanilla JavaScript (IIFE engine, works in browser + Node)
- **Render:** HTML Canvas 2D
- **UI chrome:** Semantic HTML + CSS (IBM Plex)
- **Embed:** WordPress shortcode plugin (PHP 7.4+, WP 6.0+)
- **Tests:** `node --test` (no bundler required)
- **License:** MIT

No React/Vue build step for the player. Collaborators can open `play/` and ship.

---

## Quick start (developers)

### Prerequisites

- Node.js 20+ (tests + static server)
- Optional: local WordPress for the plugin

### Install & test

```bash
npm install   # no runtime deps; scripts only
npm test      # engine + packaging smoke tests
npm start     # serve ./play
```

### WordPress plugin

1. Copy `wordpress-plugin/` → `wp-content/plugins/git-blocks/`  
   (or zip via `npm run pack:wp`)
2. Activate **Branchborne Gem Quest** in WP Admin
3. Add:

```
[git_blocks]
[git_blocks layout="viewport" autostart="false"]
```

| Attribute | Default | Notes |
|-----------|---------|--------|
| `layout` | `viewport` | Embed layout |
| `autostart` | `false` | Auto-start after class pick |
| `share_url` | current URL | Share tab base URL |

---

## Roadmap (collaborator-friendly)

Ideas we’re excited to take PRs on:

- [ ] Mobile touch polish & responsive quest rail
- [ ] More pathway classes / exclusive raid trophies
- [ ] Accessibility pass (reduced motion, color-blind gem marks)
- [ ] i18n / translation packs for quest copy
- [ ] Optional TypeScript types for the engine API
- [ ] Steam-adjacent / itch.io packaging notes
- [ ] Multiplayer async “compare LOC” share cards

See [CONTRIBUTING.md](CONTRIBUTING.md) and open an issue before large features.

---

## Seeking collaborators

This repo is the **home of the game** — spun out of [matthummel-pa](https://github.com/matthummel-pa/matthummel-pa) so people can star, fork, and ship together.

**Great first contributions**

- Quest / tip copy that teaches real web-dev craft
- Gem art / shatter polish
- Unit tests for match resolution & pathway progression
- WordPress block (Gutenberg) wrapper around the shortcode
- Docs, GIFs, and “how to embed” guides

**How we work**

1. Open an issue (bug / feature / discussion)
2. Fork → branch → PR against `main`
3. Keep PRs focused; include `npm test` green
4. Be kind — [Code of Conduct](CODE_OF_CONDUCT.md)

Maintainer: [Matt Hummel](https://matthummel.com) ([@matthummel-pa](https://github.com/matthummel-pa))

---

## API surface (engine)

The canvas player boots from `[data-git-blocks]`. The same file exports a Node-friendly API:

```js
const Branchborne = require("./play/git-blocks.js");
// Branchborne.createGame({ pathwayId, random })
// Branchborne.GEMS, .CURRICULUM, .PATHWAY_CLASSES, .TROPHIES, .boot
```

Use it to script boards in tests or build alternate UIs.

---

## Credits & inspiration

Inspired by the feel of **Bejeweled**, the loadout fantasy of **Gems of War**, and the quest cadence of **World of Warcraft** side quests — applied to shipping web skills.

Not affiliated with those brands. Tech gem marks are stylized tributes, not official trademarks.

---

## License

[MIT](LICENSE) © Matt Hummel

Play fair, fork freely, teach loudly.
