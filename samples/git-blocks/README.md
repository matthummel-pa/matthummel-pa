# Git Blocks — WordPress plugin sample

Copy-ready WordPress plugin that embeds the **Git Blocks** tetris-style cabinet via shortcode. Meant as a portfolio / demo sample you can drop into any WP project or zip for a repo.

## Install (copy)

1. Copy this folder to `wp-content/plugins/git-blocks/`
2. Activate **Git Blocks** in WP Admin → Plugins
3. Add the shortcode to a page:

```
[git_blocks]
```

Optional attributes:

```
[git_blocks layout="viewport" autostart="false" share_url="https://example.com/git-blocks/"]
```

| Attribute   | Default    | Notes                                      |
|------------|------------|--------------------------------------------|
| `layout`   | `viewport` | `viewport` fills the embed; `card` reserved |
| `autostart`| `false`    | Set `true` to auto-start level 1           |
| `share_url`| current URL| Base URL used by the Share tab             |

## Pack for a sample repo

From this folder (or repo root):

```bash
./bin/pack.sh
```

Creates `dist/git-blocks-1.0.0.zip` with the plugin root named `git-blocks/` (WordPress-installable zip).

Or from the monorepo root:

```bash
bash samples/git-blocks/bin/pack.sh
```

## Features shipped in the sample

- Canvas game engine (rotate with wall kicks, hold, levels)
- Mouse-friendly board: scroll to move, right-click rotate, drag, edge nudges
- **Customize** panel: CSS/solid/gradient/image backgrounds, generated open-source-style BGM + custom CC audio URL, remappable keys/mouse, share link (Web Share + copy + X/LinkedIn)
- Preferences persist in `localStorage`; share links can encode look + music in the hash (`#gb=…`)

## Folder map

```
git-blocks/
├── git-blocks.php          # Plugin bootstrap
├── includes/
│   └── class-git-blocks-plugin.php
├── templates/
│   └── player.php          # Shortcode markup
├── assets/
│   ├── css/git-blocks.css
│   └── js/git-blocks.js
├── bin/pack.sh
├── readme.txt              # WP-style readme
└── README.md               # This file
```

## Standalone (no WordPress)

The same cabinet also lives at `game/` in the profile repo (`index.html` + css/js) for GitHub Pages / static demos. Keep plugin `assets/` and `game/` in sync when you change the player.

## License

MIT — see plugin header. Generated music loops are created in-browser (no third-party audio binary required). Custom audio URLs are the site owner's responsibility (use CC0 / CC-BY sources).
