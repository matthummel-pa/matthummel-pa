# AGENTS.md — matthummel-pa profile

This repository is the GitHub profile for **matthummel-pa** (Matt Hummel). The README is the
landing page; two scripts keep it current from GitHub Actions.

## Profile overview (apply to every edit)

- **Role focus:** Full-stack web developer specializing in custom WordPress on the Roots stack
  (Bedrock, Sage, Trellis) and Microsoft Power Platform solutions.
- **Core stack:** PHP, JavaScript, Tailwind CSS, Docker, Composer, Power Apps, Power Automate.
- Voice: plain, direct, first person. No fake metrics, testimonials, or hype.
- Work shown is sample work built in public unless it says otherwise. Client and employer work
  stays private.

## What is generated (do not hand-edit between the markers)

| Marker pair | Source | Script |
| --- | --- | --- |
| `START_SECTION:projects` | newest 4 on matthummel.com/projects/ (listing order; title, lead, first screenshot, demo, repo) | `.github/scripts/update-site.py` |
| `START_SECTION:posts` | latest 5 journal posts via `wp-json/wp/v2/posts` (title, date, excerpt, featured image) | `.github/scripts/update-site.py` |
| `assets/skills.svg` | `SKILL_GROUPS` in the script; glyphs from simple-icons at build time | `.github/scripts/update-site.py` |
| `START_SECTION:heatmap` / `activity` / `pushed` | GitHub contributions, events, repos | `.github/scripts/update-activity.py` |

`update-readme-activity.yml` runs both scripts hourly and on push to `main`. Each block fails
soft: an unreachable source leaves the existing README text in place.

Run locally: `python3 .github/scripts/update-site.py` and `python3 -m unittest discover -s tests`.

## Repository documentation standards (every matthummel-pa repo)

- **Short description:** one crisp sentence that says what it is and who it is for.
- **Topics:** use `wordpress`, `roots-sage`, `php`, `powerplatform` where they apply, plus the
  product kind (`wordpress-theme`, `wordpress-plugin`, `gutenberg`, `tailwindcss`).
- **README:** setup instructions, stack components, usage, and a visual or architectural
  overview (screenshot, diagram, or a short structure tree).
- **Commits:** conventional prefixes (`feat`, `fix`, `docs`, `chore`); the body says *why*.
- **.gitignore:** never commit `.env*`, `wp-config.php`, database dumps, `vendor/`,
  `node_modules/`, build output, or tokens. Secrets live in CI secrets or wp-config constants.

## Editing the README

- Keep section order: intro → what I build → stack → latest projects → journal → open source →
  Branchborne → GitHub activity → how I work → open for work → connect.
- Images in tables sit **left**, copy **right** (`<td width>` + `valign="top"`). GitHub strips
  CSS, so layout is tables and widths only.
- Links go to matthummel.com pages first, GitHub second.
