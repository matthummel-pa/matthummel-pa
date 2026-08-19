# AGENTS.md

## Cursor Cloud specific instructions

This repository is the **GitHub profile README** for `matthummel-pa` (a special `<user>/<user>` repo). Its entire product is the single `README.md`, which GitHub renders at the top of the profile page. There is **no** package manager, build system, test suite, lint config, backend, or service here.

### Developing / previewing

- The dev loop is: edit `README.md` → preview the GitHub-rendered output. `README.md` is heavy on inline HTML (centered `<p>`/`<h1>`, `img.shields.io` badges, Markdown tables), so a plain Markdown viewer will not match GitHub. Use `grip`, which renders through GitHub's own Markdown API for a faithful preview.
- Start the preview (grip is installed by the update script into `~/.local/bin`; invoking via `python3 -m grip` avoids PATH issues):
  - `python3 -m grip README.md 0.0.0.0:6419 --wide`
  - Then open `http://localhost:6419`. grip re-reads the file on each request, so just reload the page after editing (no restart needed).
- grip calls the public GitHub Markdown API. Unauthenticated it allows ~60 requests/hour, which is plenty for interactive previewing. If you hit a rate limit, pass credentials, e.g. `python3 -m grip README.md --user <gh-user> --pass <token>`.

### Testing / lint / build

- There is nothing to build and no automated tests or linters configured. "Testing" a change means visually verifying the rendered preview (badges load, tables format, links resolve). Do not add build/lint tooling unless the user asks.
