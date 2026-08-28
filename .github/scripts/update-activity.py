#!/usr/bin/env python3
"""Refresh the Recent activity section in README.md from Matt's public GitHub work."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

USERNAME = os.environ.get("GH_USERNAME", "matthummel-pa")
TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN") or ""
README = Path(__file__).resolve().parents[2] / "README.md"
START = "<!--START_SECTION:activity-->"
END = "<!--END_SECTION:activity-->"
MAX_LINES = int(os.environ.get("ACTIVITY_MAX_LINES", "15"))


def api(path: str) -> dict | list:
    url = path if path.startswith("http") else f"https://api.github.com/{path.lstrip('/')}"
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": f"{USERNAME}-readme-activity",
            **({"Authorization": f"Bearer {TOKEN}"} if TOKEN else {}),
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def trunc(text: str, n: int = 88) -> str:
    text = (text or "").strip()
    return text if len(text) <= n else text[: n - 1] + "…"


def collect() -> list[str]:
    items: list[dict] = []

    commits = api(
        "search/commits?"
        + urllib.parse.urlencode(
            {"q": f"author:{USERNAME}", "sort": "author-date", "order": "desc", "per_page": "30"}
        )
    )
    for c in commits.get("items", []):
        msg = trunc((c.get("commit", {}).get("message") or "").split("\n")[0])
        if not msg:
            continue
        repo = c["repository"]["full_name"]
        items.append(
            {
                "date": c["commit"]["author"]["date"],
                "kind": "commit",
                "repo": repo,
                "pr_num": _pr_num(msg),
                "key": f"commit:{c.get('sha')}",
                "line": f"- 🚀 Commit in [{repo}]({c.get('html_url')}) — _{msg}_",
            }
        )

    prs = api(
        "search/issues?"
        + urllib.parse.urlencode(
            {
                "q": f"author:{USERNAME} type:pr",
                "sort": "updated",
                "order": "desc",
                "per_page": "30",
            }
        )
    )
    for p in prs.get("items", []):
        title = trunc(p.get("title") or "PR")
        parts = p["repository_url"].rstrip("/").split("/")
        repo = f"{parts[-2]}/{parts[-1]}"
        state = p.get("state")
        merged_at = (p.get("pull_request") or {}).get("merged_at")
        if merged_at:
            verb = "Merged"
        elif state == "closed":
            verb = "Closed"
        else:
            verb = "Open"
        num = p.get("number")
        items.append(
            {
                "date": p.get("updated_at") or p.get("created_at"),
                "kind": "pr",
                "repo": repo,
                "pr_num": num,
                "key": f"pr:{repo}:{num}",
                "line": (
                    f"- 🔀 {verb} PR [#{num}]({p.get('html_url')}) in "
                    f"[{repo}](https://github.com/{repo}) — {title}"
                ),
            }
        )

    try:
        events = api(f"users/{USERNAME}/events/public?per_page=50")
    except urllib.error.HTTPError:
        events = []

    for e in events:
        t = e.get("type")
        repo = e["repo"]["name"]
        url = f"https://github.com/{repo}"
        payload = e.get("payload") or {}
        date = e["created_at"]
        if t == "WatchEvent":
            line = f"- ⭐ Starred [{repo}]({url})"
            key = f"star:{repo}:{date[:10]}"
        elif t == "ForkEvent":
            line = f"- 🍴 Forked [{repo}]({url})"
            key = f"fork:{repo}:{date[:10]}"
        elif t == "ReleaseEvent":
            rel = payload.get("release") or {}
            line = f"- 🏷️ Released [{rel.get('tag_name')}]({rel.get('html_url')}) in [{repo}]({url})"
            key = f"rel:{repo}:{rel.get('tag_name')}"
        elif t == "CreateEvent" and payload.get("ref_type") == "repository":
            line = f"- 🌱 Created repo [{repo}]({url})"
            key = f"create:{repo}"
        elif t == "PublicEvent":
            line = f"- 🌍 Made [{repo}]({url}) public"
            key = f"public:{repo}"
        elif t == "IssuesEvent":
            issue = payload.get("issue") or {}
            action = (payload.get("action") or "updated").capitalize()
            line = (
                f"- 📝 {action} issue [#{issue.get('number')}]({issue.get('html_url')}) "
                f"in [{repo}]({url}) — {trunc(issue.get('title') or '')}"
            )
            key = f"issue:{repo}:{issue.get('number')}:{action}"
        else:
            continue
        items.append(
            {
                "date": date,
                "kind": "event",
                "repo": repo,
                "pr_num": None,
                "key": key,
                "line": line,
            }
        )

    items.sort(key=lambda x: x["date"], reverse=True)

    # Prefer PRs over matching merge commits, keep a mix of kinds so the
    # feed reflects all activity (not only a wall of pull requests).
    quotas = {"pr": 8, "commit": 8, "event": 4}
    counts = {"pr": 0, "commit": 0, "event": 0}
    seen_keys: set[str] = set()
    listed_prs: set[tuple[str, int]] = set()
    selected: list[dict] = []

    for it in items:
        if it["key"] in seen_keys:
            continue
        kind = it["kind"]
        if kind == "commit" and it["pr_num"] is not None:
            if (it["repo"], it["pr_num"]) in listed_prs:
                continue
        if counts.get(kind, 0) >= quotas.get(kind, MAX_LINES):
            continue
        seen_keys.add(it["key"])
        counts[kind] = counts.get(kind, 0) + 1
        if kind == "pr" and it["pr_num"] is not None:
            listed_prs.add((it["repo"], it["pr_num"]))
        selected.append(it)

    selected.sort(key=lambda x: x["date"], reverse=True)
    return [it["line"] for it in selected[:MAX_LINES]]


def _pr_num(message: str) -> int | None:
    m = re.search(r"\(#(\d+)\)\s*$", message)
    return int(m.group(1)) if m else None


def main() -> None:
    lines = collect()
    body = "\n".join(lines) if lines else "- _No recent public activity yet — check back soon._"
    text = README.read_text(encoding="utf-8")
    if START not in text or END not in text:
        raise SystemExit(f"Missing {START} / {END} markers in README.md")
    pattern = re.compile(
        re.escape(START) + r".*?" + re.escape(END),
        re.DOTALL,
    )
    replacement = f"{START}\n{body}\n{END}"
    updated = pattern.sub(replacement, text, count=1)
    if updated == text:
        print("Activity section already up to date.")
    else:
        README.write_text(updated, encoding="utf-8")
        print(f"Updated README with {len(lines)} activity lines.")


if __name__ == "__main__":
    main()
