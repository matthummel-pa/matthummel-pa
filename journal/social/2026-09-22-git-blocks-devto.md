---
title: Building Git Blocks with Cursor AI — for fun
published: true
description: I prompted Cursor Cloud agents to turn a Tetris toy into a match-3 web-dev RPG. Prompts, folder layout, code snippets, timing, and what I would prompt differently.
tags: javascript, ai, webdev, gamedev, cursor
canonical_url: https://matthummel.com/building-git-blocks-with-cursor-ai/
cover_image: https://cdn.jsdelivr.net/gh/matthummel-pa/matthummel-pa@main/assets/blog/git-blocks/01-pathway-select.jpg
---

**Building a browser game with Cursor AI** started as a joke on my GitHub profile. I wanted something people could click. By the end of one dense day of prompting and merges, [Git Blocks](https://matthummel-pa.github.io/matthummel-pa/) was a match-3 RPG that teaches web development from Intern to Senior Developer.

I built it **for fun**. No shop brief. That let me throw away Tetris mid-day when the idea got better.

## What shipped

- 8×8 match-3 with shiny web-dev logo gems (HTML → npm)
- Score as **lines of code**
- 20-lesson path toward Senior Developer
- Lesson-tied floating “cloud” words + fact popups on every clear
- Pathway classes with cartoon chibis and class powers

![Pathway select with cartoon heroes](https://cdn.jsdelivr.net/gh/matthummel-pa/matthummel-pa@main/assets/blog/git-blocks/01-pathway-select.jpg)

![Lesson intro after picking Frontend Mage](https://cdn.jsdelivr.net/gh/matthummel-pa/matthummel-pa@main/assets/blog/git-blocks/02-frontend-mage-start.jpg)

![Web Dev Fact popup on clear](https://cdn.jsdelivr.net/gh/matthummel-pa/matthummel-pa@main/assets/blog/git-blocks/03-web-dev-fact.jpg)

## How long it took

One calendar day (22 Sep 2026). Four feature PRs merged that afternoon/evening after morning polish:

| PR | Change |
|----|--------|
| [#27](https://github.com/matthummel-pa/matthummel-pa/pull/27) | Gravity, clouds, music |
| [#28](https://github.com/matthummel-pa/matthummel-pa/pull/28) | Match-3 + curriculum |
| [#29](https://github.com/matthummel-pa/matthummel-pa/pull/29) | Lesson intros + fact modals |
| [#30](https://github.com/matthummel-pa/matthummel-pa/pull/30) | Start menu + cartoon heroes |

My attention: a few hours of prompting and review. Agent runtime: much longer. I would not sell that as a client estimate — but for a profile toy with tests, the pace was real.

## Prompts that worked

- Symptom-first bugs (“clouds missing, music unlocks on Start”)
- Genre pivot (“original besides Tetris?” → Jewel Quest–style gems)
- Product goal (“teach web dev each level… facts on clear… path to Senior”)
- Explicit ship (“merge and deploy”)

## What I would prompt better next time

1. **Acceptance criteria** — not “advanced graphics,” but “60fps, no monochrome boards, clouds visible, music on Play.”
2. **Scope gates** — match-3 + facts first; raids/chibis second.
3. **DOM contracts** — “class cards must click; don’t rebuild every frame.”
4. **Seed the curriculum** — paste a 20-topic outline myself, let the agent fill structure.

## Folder structure

```bash
matthummel-pa/
├── game/                 # source of truth (~3.9k LOC JS)
├── docs/                 # GitHub Pages mirror
├── samples/git-blocks/   # WP plugin sample
├── tests/test_git_blocks.js
└── assets/blog/git-blocks/
```

## Code the AI wrote (curriculum slice)

```js
const CURRICULUM = [
  {
    id: "html-bones",
    title: "HTML bones",
    rank: "Intern",
    clouds: ["<!DOCTYPE>", "<html>", "semantic"],
    facts: [
      "HTML is the skeleton of every webpage — tags describe meaning, not looks.",
    ],
  },
  // …through senior
];
```

## The start-menu bug

Overlay had `pointer-events: none` while the class cards lived inside it — and cards rebuilt every frame. Boring CSS + one-shot build fixed “start menu isn’t working.”

## Play / source

- Play: https://matthummel-pa.github.io/matthummel-pa/
- Repo: https://github.com/matthummel-pa/matthummel-pa
- Longer write-up (canonical): https://matthummel.com/building-git-blocks-with-cursor-ai/

If you ship WordPress or small web apps and want this kind of AI-assisted loop with a human review bar, [say hello](https://matthummel.com/contact/).
