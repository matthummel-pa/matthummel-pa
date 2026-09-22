#!/usr/bin/env python3
"""Refresh custom GitHub activity blocks in the profile README.

Mirrors the Code page on matthummel.com: a 90-day navy heatmap (newest week
first), a public activity feed, and recently pushed repos.
"""

from __future__ import annotations

import datetime as dt
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Callable

USERNAME = os.environ.get("GH_USERNAME", "matthummel-pa")
TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN") or ""
ROOT = Path(__file__).resolve().parents[2]
README = ROOT / "README.md"
HEATMAP = ROOT / "assets" / "activity-heatmap.svg"
MAX_LINES = int(os.environ.get("ACTIVITY_MAX_LINES", "12"))
CAL_DAYS = int(os.environ.get("ACTIVITY_CAL_DAYS", "90"))

NAVY = ["#eef3f9", "#dceaf8", "#93c5fd", "#4f8fd4", "#0d2e57"]

ACTIVITY_START = "<!--START_SECTION:activity-->"
ACTIVITY_END = "<!--END_SECTION:activity-->"
HEATMAP_START = "<!--START_SECTION:heatmap-->"
HEATMAP_END = "<!--END_SECTION:heatmap-->"
PUSHED_START = "<!--START_SECTION:pushed-->"
PUSHED_END = "<!--END_SECTION:pushed-->"


Json = dict[str, Any] | list[Any]
Fetcher = Callable[[str], Json | str]


def _headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": f"{USERNAME}-readme-activity",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    return headers


def default_fetch(url: str) -> Json | str:
    req = urllib.request.Request(url, headers=_headers())
    if "github.com/users/" in url and "/contributions" in url:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": f"{USERNAME}-readme-activity",
                "Accept": "text/html",
            },
        )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read().decode("utf-8")
        ctype = resp.headers.get("Content-Type", "")
        if "json" in ctype or url.startswith("https://api.github.com"):
            return json.loads(body)
        return body


def api(path: str, fetch: Fetcher) -> Json:
    url = path if path.startswith("http") else f"https://api.github.com/{path.lstrip('/')}"
    return fetch(url)


def trunc(text: str, n: int = 72) -> str:
    text = (text or "").strip()
    return text if len(text) <= n else text[: n - 1] + "…"


def _pr_num(message: str) -> int | None:
    m = re.search(r"\(#(\d+)\)\s*$", message)
    return int(m.group(1)) if m else None


def relative_time(iso: str, now: dt.datetime | None = None) -> str:
    if not iso:
        return ""
    stamp = dt.datetime.fromisoformat(iso.replace("Z", "+00:00"))
    now = now or dt.datetime.now(dt.timezone.utc)
    if stamp.tzinfo is None:
        stamp = stamp.replace(tzinfo=dt.timezone.utc)
    delta = max(dt.timedelta(0), now - stamp)
    seconds = int(delta.total_seconds())
    if seconds < 90:
        return "just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{minutes}m"
    hours = minutes // 60
    if hours < 36:
        return f"{hours}h"
    days = hours // 24
    if days < 14:
        return f"{days}d"
    weeks = days // 7
    if weeks < 8:
        return f"{weeks}w"
    return stamp.strftime("%b %-d") if os.name != "nt" else stamp.strftime("%b %d").replace(" 0", " ")


def parse_contribution_html(html: str) -> list[dict[str, Any]]:
    """Parse GitHub's public contributions calendar (weekday-row major)."""
    pairs = re.findall(
        r'data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d+)"[^>]*>\s*</td>\s*'
        r"<tool-tip[^>]*>([^<]*)</tool-tip>",
        html,
        flags=re.I,
    )
    if not pairs:
        tags = re.findall(r"<td\b[^>]*>", html, flags=re.I)
        parsed: list[tuple[str, str, str]] = []
        for tag in tags:
            date_m = re.search(r'data-date="(\d{4}-\d{2}-\d{2})"', tag)
            level_m = re.search(r'data-level="(\d+)"', tag)
            if date_m and level_m:
                parsed.append((date_m.group(1), level_m.group(1), ""))
        pairs = parsed

    days: dict[str, dict[str, Any]] = {}
    for date, level_s, tip in pairs:
        count_m = re.search(r"(\d+)\s+contribution", tip or "", flags=re.I)
        if (tip or "").lower().startswith("no contribution"):
            count = 0
        elif count_m:
            count = int(count_m.group(1))
        else:
            count = int(level_s)
        level = max(0, min(4, int(level_s)))
        days[date] = {"date": date, "count": count, "level": level}
    return [days[k] for k in sorted(days)]


def weeks_from_days(days: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    if not days:
        return []
    first = dt.date.fromisoformat(days[0]["date"])
    # GitHub weeks start Sunday. datetime.strftime('%w'): 0 = Sunday.
    pad = int(first.strftime("%w"))
    blank = {"date": "", "count": 0, "level": 0}
    week: list[dict[str, Any]] = [blank.copy() for _ in range(pad)]
    weeks: list[list[dict[str, Any]]] = []
    for day in days:
        week.append(day)
        if len(week) == 7:
            weeks.append(week)
            week = []
    if week:
        while len(week) < 7:
            week.append(blank.copy())
        weeks.append(week)
    return weeks


def clip_last_days(
    days: list[dict[str, Any]], window: int, today: dt.date | None = None
) -> list[dict[str, Any]]:
    today = today or dt.date.today()
    start = today - dt.timedelta(days=window - 1)
    return [d for d in days if d["date"] and start <= dt.date.fromisoformat(d["date"]) <= today]


def fetch_contributions(fetch: Fetcher) -> dict[str, Any]:
    html = fetch(f"https://github.com/users/{USERNAME}/contributions")
    if not isinstance(html, str):
        html = str(html)
    days = parse_contribution_html(html)
    window = clip_last_days(days, CAL_DAYS)
    year_total = sum(d["count"] for d in days)
    return {
        "days": days,
        "window": window,
        "weeks": weeks_from_days(window if window else days[-CAL_DAYS:]),
        "window_total": sum(d["count"] for d in window),
        "year_total": year_total,
    }


def heatmap_svg(weeks: list[list[dict[str, Any]]], total: int, year_total: int) -> str:
    """Newest week first, matching matthummel.com/code."""
    cols = list(reversed(weeks[-13:])) if weeks else []
    cell, gap = 14, 4
    label_w, label_h = 22, 28
    grid_w = max(len(cols), 1) * (cell + gap)
    width = max(520, label_w + grid_w + 16)
    height = label_h + 7 * (cell + gap) + 32
    weekday = ["S", "M", "T", "W", "T", "F", "S"]
    rects: list[str] = []
    for x, week in enumerate(cols):
        for y, day in enumerate(week):
            color = NAVY[int(day.get("level") or 0)]
            px = label_w + x * (cell + gap)
            py = label_h + y * (cell + gap)
            title = "No day"
            if day.get("date"):
                count = int(day.get("count") or 0)
                noun = "contribution" if count == 1 else "contributions"
                title = f"{count} {noun} on {day['date']}"
            rects.append(
                f'<rect x="{px}" y="{py}" width="{cell}" height="{cell}" rx="2" '
                f'fill="{color}"><title>{title}</title></rect>'
            )
    labels = "".join(
        f'<text x="0" y="{label_h + i * (cell + gap) + 10}" fill="#64748b" '
        f'font-size="9" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">'
        f"{weekday[i]}</text>"
        for i in (1, 3, 5)
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{total} contributions in the last {CAL_DAYS} days">
  <title>Last {CAL_DAYS} days of public GitHub work — {total} contributions</title>
  <rect width="100%" height="100%" rx="8" fill="#f7f9fc"/>
  <text x="8" y="13" fill="#0d2e57" font-size="11" font-family="Inter, IBM Plex Sans, system-ui, sans-serif" font-weight="600">Last {CAL_DAYS} days · newest week left · {total:,} here / {year_total:,} this year</text>
  {labels}
  {''.join(rects)}
  <text x="8" y="{height - 8}" fill="#64748b" font-size="9" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">Less</text>
  {''.join(f'<rect x="{40 + i * 15}" y="{height - 18}" width="11" height="11" rx="2" fill="{NAVY[i]}"/>' for i in range(5))}
  <text x="{40 + 5 * 15 + 4}" y="{height - 8}" fill="#64748b" font-size="9" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">More</text>
</svg>
"""


def collect_activity(fetch: Fetcher) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    commits = api(
        "search/commits?"
        + urllib.parse.urlencode(
            {"q": f"author:{USERNAME}", "sort": "author-date", "order": "desc", "per_page": "30"}
        ),
        fetch,
    )
    for c in (commits or {}).get("items", []) if isinstance(commits, dict) else []:
        msg = trunc((c.get("commit", {}).get("message") or "").split("\n")[0])
        if not msg:
            continue
        repo = c["repository"]["full_name"]
        items.append(
            {
                "date": c["commit"]["author"]["date"],
                "kind": "commit",
                "icon": "🚀",
                "verb": "Commit",
                "repo": repo,
                "pr_num": _pr_num(msg),
                "key": f"commit:{c.get('sha')}",
                "url": c.get("html_url"),
                "title": msg,
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
        ),
        fetch,
    )
    for p in (prs or {}).get("items", []) if isinstance(prs, dict) else []:
        title = trunc(p.get("title") or "PR")
        parts = p["repository_url"].rstrip("/").split("/")
        repo = f"{parts[-2]}/{parts[-1]}"
        state = p.get("state")
        merged_at = (p.get("pull_request") or {}).get("merged_at")
        if merged_at:
            verb = "Merged"
            icon = "✅"
        elif state == "closed":
            verb = "Closed"
            icon = "❎"
        else:
            verb = "Opened"
            icon = "🔀"
        num = p.get("number")
        items.append(
            {
                "date": p.get("updated_at") or p.get("created_at"),
                "kind": "pr",
                "icon": icon,
                "verb": f"{verb} PR #{num}",
                "repo": repo,
                "pr_num": num,
                "key": f"pr:{repo}:{num}",
                "url": p.get("html_url"),
                "title": title,
            }
        )

    try:
        events = api(f"users/{USERNAME}/events/public?per_page=50", fetch)
    except urllib.error.HTTPError:
        events = []
    if not isinstance(events, list):
        events = []

    for e in events:
        t = e.get("type")
        repo = e["repo"]["name"]
        url = f"https://github.com/{repo}"
        payload = e.get("payload") or {}
        date = e["created_at"]
        if t == "WatchEvent":
            item = {
                "icon": "⭐",
                "verb": "Starred",
                "title": repo,
                "url": url,
                "key": f"star:{repo}:{date[:10]}",
            }
        elif t == "ForkEvent":
            item = {
                "icon": "🍴",
                "verb": "Forked",
                "title": repo,
                "url": url,
                "key": f"fork:{repo}:{date[:10]}",
            }
        elif t == "ReleaseEvent":
            rel = payload.get("release") or {}
            item = {
                "icon": "🏷️",
                "verb": "Released",
                "title": rel.get("tag_name") or "release",
                "url": rel.get("html_url") or url,
                "key": f"rel:{repo}:{rel.get('tag_name')}",
            }
        elif t == "CreateEvent" and payload.get("ref_type") == "repository":
            item = {
                "icon": "🌱",
                "verb": "Created",
                "title": repo,
                "url": url,
                "key": f"create:{repo}",
            }
        elif t == "PublicEvent":
            item = {
                "icon": "🌍",
                "verb": "Published",
                "title": repo,
                "url": url,
                "key": f"public:{repo}",
            }
        elif t == "IssuesEvent":
            issue = payload.get("issue") or {}
            action = (payload.get("action") or "updated").capitalize()
            item = {
                "icon": "📝",
                "verb": f"{action} issue #{issue.get('number')}",
                "title": trunc(issue.get("title") or ""),
                "url": issue.get("html_url") or url,
                "key": f"issue:{repo}:{issue.get('number')}:{action}",
            }
        elif t == "PushEvent":
            commits_n = len(payload.get("commits") or [])
            if commits_n == 0:
                continue
            noun = "commit" if commits_n == 1 else "commits"
            item = {
                "icon": "📦",
                "verb": f"Pushed {commits_n} {noun}",
                "title": trunc((payload.get("commits") or [{}])[-1].get("message") or repo),
                "url": url,
                "key": f"push:{repo}:{e.get('id')}",
            }
        else:
            continue
        items.append({"date": date, "kind": "event", "repo": repo, "pr_num": None, **item})

    items.sort(key=lambda x: x["date"], reverse=True)
    quotas = {"pr": 6, "commit": 5, "event": 4}
    counts = {"pr": 0, "commit": 0, "event": 0}
    seen_keys: set[str] = set()
    listed_prs: set[tuple[str, int]] = set()
    selected: list[dict[str, Any]] = []

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
    return selected[:MAX_LINES]


def render_activity_table(items: list[dict[str, Any]], now: dt.datetime | None = None) -> str:
    if not items:
        return "_No recent public activity yet — check back soon._"
    lines = [
        "| | Shipped | Repo | When |",
        "| --- | --- | --- | --- |",
    ]
    for it in items:
        repo = it["repo"]
        short = repo.split("/")[-1]
        title = trunc(it.get("title") or "", 64)
        shipped = f"{it['icon']} [{it['verb']}]({it['url']}) — {title}"
        repo_link = f"[`{short}`](https://github.com/{repo})"
        lines.append(f"| | {shipped} | {repo_link} | {relative_time(it['date'], now)} |")
    return "\n".join(lines)


def collect_pushed(fetch: Fetcher) -> list[dict[str, Any]]:
    repos = api(f"users/{USERNAME}/repos?per_page=12&sort=pushed&type=owner", fetch)
    if not isinstance(repos, list):
        return []
    skip = {USERNAME.lower(), f"{USERNAME}.github.io".lower()}
    out: list[dict[str, Any]] = []
    for r in repos:
        if r.get("fork") or (r.get("name") or "").lower() in skip:
            continue
        lang = r.get("language") or "Code"
        desc = trunc(r.get("description") or "Public work from Gettysburg.", 88)
        out.append(
            {
                "name": r["name"],
                "url": r["html_url"],
                "lang": lang,
                "desc": desc,
                "stars": int(r.get("stargazers_count") or 0),
                "pushed": r.get("pushed_at") or "",
            }
        )
        if len(out) == 4:
            break
    return out


def render_pushed(repos: list[dict[str, Any]], now: dt.datetime | None = None) -> str:
    if not repos:
        return "_No public pushes yet._"
    lines = ["| Repo | Stack | Last push |", "| --- | --- | --- |"]
    for r in repos:
        lines.append(
            f"| **[{r['name']}]({r['url']})** — {r['desc']} | {r['lang']} · ★{r['stars']} | {relative_time(r['pushed'], now)} |"
        )
    return "\n".join(lines)


def render_heatmap_block(cal: dict[str, Any]) -> str:
    total = int(cal.get("window_total") or 0)
    return (
        f'<p align="center">\n'
        f'  <a href="https://matthummel.com/code/#gh-contributions">\n'
        f'    <img src="./assets/activity-heatmap.svg" width="680" alt="{total} public contributions in the last {CAL_DAYS} days" />\n'
        f"  </a>\n"
        f"</p>\n\n"
        f"<sub>Custom calendar (not the GitHub default card). Newest week on the left, navy scale from "
        f"[matthummel.com/code](https://matthummel.com/code/). {total:,} contributions in {CAL_DAYS} days · "
        f"{int(cal.get('year_total') or 0):,} in the last year.</sub>"
    )


def replace_section(text: str, start: str, end: str, body: str) -> str:
    if start not in text or end not in text:
        raise SystemExit(f"Missing {start} / {end} markers in README.md")
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    return pattern.sub(f"{start}\n{body}\n{end}", text, count=1)


def update(fetch: Fetcher = default_fetch) -> dict[str, Any]:
    cal = fetch_contributions(fetch)
    HEATMAP.parent.mkdir(parents=True, exist_ok=True)
    HEATMAP.write_text(heatmap_svg(cal["weeks"], cal["window_total"], cal["year_total"]), encoding="utf-8")

    activity = collect_activity(fetch)
    pushed = collect_pushed(fetch)
    text = README.read_text(encoding="utf-8")
    text = replace_section(text, HEATMAP_START, HEATMAP_END, render_heatmap_block(cal))
    text = replace_section(text, ACTIVITY_START, ACTIVITY_END, render_activity_table(activity))
    text = replace_section(text, PUSHED_START, PUSHED_END, render_pushed(pushed))
    README.write_text(text, encoding="utf-8")
    return {
        "activity": len(activity),
        "pushed": len(pushed),
        "window_total": cal["window_total"],
        "year_total": cal["year_total"],
    }


def main() -> None:
    result = update()
    print(
        "Updated README activity: "
        f"{result['activity']} rows, {result['pushed']} repos, "
        f"{result['window_total']} contribs / {CAL_DAYS}d."
    )


if __name__ == "__main__":
    main()
