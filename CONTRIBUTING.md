# Contributing to Branchborne Gem Quest

Thanks for helping build a match-3 that teaches real web craft.

## Ground rules

- Be respectful — see [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Open an issue before large or breaking changes
- Keep pull requests focused and reviewable
- Don’t commit secrets, credentials, or large binary dumps

## Dev setup

```bash
git clone https://github.com/matthummel-pa/branchborne-gem-quest-game.git
cd branchborne-gem-quest-game
npm test
npm start
```

- Engine + UI live in `play/git-blocks.js` and `play/git-blocks.css`
- WordPress embed lives in `wordpress-plugin/` — keep `assets/js` and `assets/css` in sync with `play/` when you change the player
- Tests: `tests/test_engine.js` (`node --test`)

## Sync checklist (player changes)

When you edit the canvas game:

1. Update `play/git-blocks.js` / `.css` / `index.html`
2. Copy JS/CSS into `wordpress-plugin/assets/`
3. Run `npm test`
4. Manual smoke: class pick → match → quest rail tip → Trophies modal

```bash
npm run sync:plugin
```

## Pull requests

1. Branch from `main` (`feat/…`, `fix/…`, `docs/…`)
2. Describe **what** and **why**; link issues
3. Note test evidence (`npm test`, screenshots for UI)
4. Prefer small PRs over mega-diffs

### PR title style

- `feat: add color-blind gem marks`
- `fix: trophy case focus trap`
- `docs: embed guide for WordPress`

## Code style

- Vanilla JS, no bundler required for the player
- Keep the engine runnable under Node for tests
- Match existing naming (`data-*` hooks, CSS variables)
- Accessibility: keyboard paths, `aria-*`, respect reduced motion where present

## Security

Report vulnerabilities privately — see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree your work is licensed under the MIT License.
