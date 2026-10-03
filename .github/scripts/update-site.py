#!/usr/bin/env python3
"""Refresh the matthummel.com-driven blocks in the profile README.

Pulls the newest projects from matthummel.com/projects/, the latest journal
posts from the WordPress REST API, and draws the animated skills banner
(assets/skills.svg) from the stack on matthummel.com/code/ plus the Roots stack and Power Platform.

Each block fails soft: if the site is unreachable the existing README text
for that block is left alone and the script says so.
"""

from __future__ import annotations

import html
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Callable

SITE = "https://matthummel.com"
ROOT = Path(__file__).resolve().parents[2]
README = ROOT / "README.md"
SKILLS_SVG = ROOT / "assets" / "skills.svg"

PROJECTS_START = "<!--START_SECTION:projects-->"
PROJECTS_END = "<!--END_SECTION:projects-->"
POSTS_START = "<!--START_SECTION:posts-->"
POSTS_END = "<!--END_SECTION:posts-->"

PROJECT_LIMIT = 4
POST_LIMIT = 5

MAX_GLYPH_BYTES = 12_000
NAVY = "#0d2e57"
BLUE = "#2c5a95"

# Stack groups for the banner: the matthummel.com/code groups plus the Roots stack and Power Platform
# (label, simple-icons slug, brand hex). Bedrock, Sage, and Trellis share the Roots mark.
SKILL_GROUPS: list[tuple[str, list[tuple[str, str, str]]]] = [
    (
        "Roots stack",
        [
            ("WordPress", "wordpress", "21759B"),
            ("Sage", "roots", "525DDC"),
            ("Bedrock", "roots", "525DDC"),
            ("Trellis", "roots", "525DDC"),
            ("Gutenberg", "gutenberg", "000000"),
            ("WooCommerce", "woocommerce", "96588A"),
        ],
    ),
    (
        "Languages & UI",
        [
            ("PHP", "php", "777BB4"),
            ("JavaScript", "javascript", "F7DF1E"),
            ("TypeScript", "typescript", "3178C6"),
            ("HTML", "html5", "E34F26"),
            ("CSS", "css", "663399"),
            ("Tailwind CSS", "tailwindcss", "06B6D4"),
            ("Sass", "sass", "CC6699"),
            ("React", "react", "61DAFB"),
            ("Next.js", "nextdotjs", "000000"),
            ("Vite", "vite", "646CFF"),
        ],
    ),
    (
        "Tooling",
        [
            ("Composer", "composer", "885630"),
            ("Node.js", "nodedotjs", "5FA04E"),
            ("Docker", "docker", "2496ED"),
            ("Git", "git", "F05032"),
            ("GitHub Actions", "githubactions", "2088FF"),
            ("VS Code", "visualstudiocode", "007ACC"),
            ("Laravel", "laravel", "FF2D20"),
        ],
    ),
    (
        "Power Platform & more",
        [
            ("Power Apps", "powerapps", "742774"),
            ("Power Automate", "powerautomate", "0066FF"),
            ("n8n", "n8n", "EA4B71"),
            ("Supabase", "supabase", "3FCF8E"),
            ("Netlify", "netlify", "00C7B7"),
        ],
    ),
]


Fetcher = Callable[[str], str]


def default_fetch(url: str, tries: int = 3) -> str:
    """GET a URL as text, retrying slow or flaky responses a couple of times."""
    req = urllib.request.Request(url, headers={"User-Agent": "matthummel-pa-readme (+https://github.com/matthummel-pa)"})
    last: Exception | None = None
    for attempt in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=40) as resp:
                return resp.read().decode("utf-8", "ignore")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last = exc
            if attempt + 1 < tries:
                time.sleep(2 * (attempt + 1))
    assert last is not None
    raise last


# ───────────────────────── helpers ─────────────────────────


def strip_tags(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def clip(text: str, n: int) -> str:
    text = (text or "").strip()
    if len(text) <= n:
        return text
    cut = text[: n - 1].rsplit(" ", 1)[0]
    return cut.rstrip(" ,;:—-") + "…"


def esc(text: str) -> str:
    return html.escape(text or "", quote=True)


def replace_section(text: str, start: str, end: str, body: str) -> str:
    if start not in text or end not in text:
        raise SystemExit(f"Missing {start} / {end} markers in README.md")
    pattern = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    return pattern.sub(lambda _m: f"{start}\n{body}\n{end}", text, count=1)


# ───────────────────────── projects ─────────────────────────


def parse_project_order(listing_html: str) -> list[str]:
    """Slugs in the order the Projects page shows them (newest first)."""
    slugs: list[str] = []
    for tag in re.findall(r"<article[^>]*data-work-card[^>]*>", listing_html, re.S):
        m = re.search(r'id="([^"]+)"', tag)
        if m and m.group(1) not in slugs:
            slugs.append(m.group(1))
    return slugs


def parse_project_page(page_html: str, slug: str) -> dict[str, Any]:
    """Title, lead, tagline, first screenshot, demo, repo, kind, and proof facts from one project page."""
    def first(pattern: str, flags: int = re.S) -> str:
        m = re.search(pattern, page_html, flags)
        return strip_tags(m.group(1)) if m else ""

    title = first(r"<h1[^>]*>(.*?)</h1>")
    lead = first(r'<p class="lead">(.*?)</p>')
    tagline = first(r'<p class="project-hero-tagline">(.*?)</p>')
    proof = [strip_tags(li) for li in re.findall(r'<li class="project-proof__item">(.*?)</li>', page_html, re.S)]
    proof = [re.sub(r"\s+", " ", p) for p in proof if p]

    image = ""
    image_alt = ""
    m = re.search(r'<script type="application/json" id="pf-gallery-data">(.*?)</script>', page_html, re.S)
    if m:
        try:
            slides = json.loads(m.group(1))
            if slides:
                image = str(slides[0].get("src", ""))
                image_alt = str(slides[0].get("alt", ""))
        except json.JSONDecodeError:
            pass
    if not image:
        m = re.search(r'<meta property="og:image" content="([^"]*)"', page_html)
        image = html.unescape(m.group(1)) if m else ""

    demo = ""
    repo = ""
    kind = ""
    version = ""
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', page_html, re.S):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        nodes = data.get("@graph", [data]) if isinstance(data, dict) else []
        for node in nodes:
            if not isinstance(node, dict) or node.get("@type") != "SoftwareApplication":
                continue
            kind = str(node.get("applicationSubCategory") or "")
            version = str(node.get("softwareVersion") or "")
            for link in node.get("sameAs", []) or []:
                link = str(link)
                if "github.com/" in link and not repo:
                    repo = link
                elif not demo:
                    demo = link
    if not demo:
        m = re.search(r'<a class="btn" href="([^"]+)"[^>]*>\s*(?:<svg.*?</svg>)?\s*Live demo', page_html, re.S)
        demo = html.unescape(m.group(1)) if m else ""

    return {
        "slug": slug,
        "url": f"{SITE}/projects/{slug}/",
        "title": title or slug,
        "lead": lead,
        "tagline": tagline,
        "image": image,
        "image_alt": image_alt or f"{title or slug} screenshot",
        "demo": demo,
        "repo": repo,
        "kind": kind,
        "version": version,
        "proof": proof[:3],
    }


def fetch_projects(fetch: Fetcher, limit: int = PROJECT_LIMIT) -> list[dict[str, Any]]:
    order = parse_project_order(fetch(f"{SITE}/projects/"))
    projects = []
    for slug in order[:limit]:
        projects.append(parse_project_page(fetch(f"{SITE}/projects/{slug}/"), slug))
    return projects


def render_projects(projects: list[dict[str, Any]]) -> str:
    if not projects:
        return "_Projects are on the way — see [matthummel.com/projects](https://matthummel.com/projects/)._"
    rows = []
    for p in projects:
        meta = " · ".join(x for x in [p.get("kind", ""), p.get("tagline", "")] if x)
        if p.get("version"):
            meta = f"{meta} · v{p['version']}" if meta else f"v{p['version']}"
        links = [f'<a href="{esc(p["url"])}">Project page</a>']
        if p.get("demo"):
            links.append(f'<a href="{esc(p["demo"])}">Live demo</a>')
        if p.get("repo"):
            links.append(f'<a href="{esc(p["repo"])}">GitHub</a>')
        proof = " &nbsp;·&nbsp; ".join(esc(x) for x in p.get("proof", []))
        img = (
            f'<a href="{esc(p["url"])}"><img src="{esc(p["image"])}" alt="{esc(p["image_alt"])}" width="280" /></a>'
            if p.get("image")
            else ""
        )
        rows.append(
            "  <tr>\n"
            f'    <td width="300" valign="top">{img}</td>\n'
            '    <td valign="top">\n'
            f'      <strong><a href="{esc(p["url"])}">{esc(p["title"])}</a></strong><br />\n'
            + (f"      <sub>{esc(meta)}</sub><br />\n" if meta else "")
            + f"      {esc(clip(p.get('lead', ''), 220))}<br />\n"
            + (f"      <sub>{proof}</sub><br />\n" if proof else "")
            + f"      {' · '.join(links)}\n"
            "    </td>\n"
            "  </tr>"
        )
    return "<table>\n" + "\n".join(rows) + "\n</table>"


# ───────────────────────── posts ─────────────────────────


def parse_posts(payload: str, limit: int = POST_LIMIT) -> list[dict[str, Any]]:
    try:
        items = json.loads(payload)
    except json.JSONDecodeError:
        return []
    posts = []
    for item in items[:limit]:
        image = ""
        image_alt = ""
        try:
            media = item["_embedded"]["wp:featuredmedia"][0]
            sizes = media.get("media_details", {}).get("sizes", {})
            for key in ("medium_large", "large", "full"):
                if key in sizes and sizes[key].get("source_url"):
                    image = sizes[key]["source_url"]
                    break
            if not image:
                image = media.get("source_url", "")
            image_alt = media.get("alt_text") or ""
        except (KeyError, IndexError, TypeError):
            pass
        title = strip_tags(item.get("title", {}).get("rendered", ""))
        posts.append(
            {
                "title": title,
                "link": item.get("link", ""),
                "date": str(item.get("date", ""))[:10],
                "excerpt": clip(strip_tags(item.get("excerpt", {}).get("rendered", "")), 190),
                "image": image,
                "image_alt": image_alt or title,
            }
        )
    return posts


def fetch_posts(fetch: Fetcher, limit: int = POST_LIMIT) -> list[dict[str, Any]]:
    url = f"{SITE}/wp-json/wp/v2/posts?per_page={limit}&_embed=wp:featuredmedia&_fields=id,link,title,excerpt,date,_links,_embedded"
    return parse_posts(fetch(url), limit)


def pretty_date(iso: str) -> str:
    try:
        y, m, d = (int(x) for x in iso.split("-"))
    except ValueError:
        return iso
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return f"{months[m - 1]} {d}, {y}"


def render_posts(posts: list[dict[str, Any]]) -> str:
    if not posts:
        return "_Latest posts live at [matthummel.com/blog](https://matthummel.com/blog/)._"
    rows = []
    for p in posts:
        img = (
            f'<a href="{esc(p["link"])}"><img src="{esc(p["image"])}" alt="{esc(p["image_alt"])}" width="220" /></a>'
            if p.get("image")
            else ""
        )
        rows.append(
            "  <tr>\n"
            f'    <td width="240" valign="top">{img}</td>\n'
            '    <td valign="top">\n'
            f'      <strong><a href="{esc(p["link"])}">{esc(p["title"])}</a></strong><br />\n'
            f'      <sub>{esc(pretty_date(p["date"]))}</sub><br />\n'
            f'      {esc(p["excerpt"])}<br />\n'
            f'      <a href="{esc(p["link"])}">Read the post →</a>\n'
            "    </td>\n"
            "  </tr>"
        )
    return "<table>\n" + "\n".join(rows) + "\n</table>"


# ───────────────────────── skills banner ─────────────────────────


def fetch_icon_path(fetch: Fetcher, slug: str) -> str:
    """The <path d> of a simple-icons glyph, or '' when it cannot be fetched."""
    try:
        svg = fetch(f"https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/{slug}.svg")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError):
        return ""
    m = re.search(r'<path d="([^"]+)"', svg)
    path = m.group(1) if m else ""
    # A few brand marks are huge (tens of KB); the banner draws each glyph twice, so fall back to initials.
    return path if len(path) <= MAX_GLYPH_BYTES else ""


def skills_svg(groups: list[tuple[str, list[tuple[str, str, str, str]]]]) -> str:
    """Two marquee rows of stack tiles. Rows scroll in opposite directions; stops under reduced motion.

    groups: (group label, [(label, slug, hex, path)]).
    """
    tile_w, tile_h, gap = 118, 64, 12
    width = 880
    rows: list[list[tuple[str, str, str, str, str]]] = [[], []]
    for i, (group, items) in enumerate(groups):
        for label, slug, color, path in items:
            rows[i % 2].append((group, label, slug, color, path))

    def tile(x: int, y: int, label: str, color: str, path: str, group: str) -> str:
        icon = (
            f'<g transform="translate({x + 14},{y + 14}) scale(1.15)"><path fill="#{color}" class="ico" d="{path}"/></g>'
            if path
            else f'<text x="{x + 28}" y="{y + 36}" class="mono" text-anchor="middle">{esc(label[:2])}</text>'
        )
        return (
            f'<g class="tile"><rect x="{x}" y="{y}" width="{tile_w}" height="{tile_h}" rx="12"/>'
            f"{icon}"
            f'<text x="{x + 50}" y="{y + 29}" class="label">{esc(label)}</text>'
            f'<text x="{x + 50}" y="{y + 46}" class="group">{esc(group)}</text></g>'
        )

    out = []
    total_h = 24 + (tile_h + 16) * 2
    for r, items in enumerate(rows):
        track_w = len(items) * (tile_w + gap)
        y = 20 + r * (tile_h + 16)
        tiles = "".join(tile(i * (tile_w + gap), y, label, color, path, group) for i, (group, label, _s, color, path) in enumerate(items))
        shifted = "".join(tile(track_w + i * (tile_w + gap), y, label, color, path, group) for i, (group, label, _s, color, path) in enumerate(items))
        dur = max(18, round(track_w / 36))
        out.append(
            f'<g class="track track-{r}" style="--w:{track_w}px;--d:{dur}s">{tiles}{shifted}</g>'
        )
    style = f"""
  <style>
    :root {{ --bg: #ffffff; --tile: #f7f9fc; --line: #d7e0ea; --ink: #0f1c2e; --muted: #5b6b7f; }}
    @media (prefers-color-scheme: dark) {{ :root {{ --bg: #0d1117; --tile: #161b22; --line: #30363d; --ink: #e6edf3; --muted: #8b949e; }} }}
    .bg {{ fill: var(--bg); }}
    .tile rect {{ fill: var(--tile); stroke: var(--line); stroke-width: 1; }}
    .label {{ font: 600 13px/1 -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif; fill: var(--ink); }}
    .group {{ font: 500 10px/1 -apple-system, "Segoe UI", Inter, Helvetica, Arial, sans-serif; fill: var(--muted); letter-spacing: .04em; text-transform: uppercase; }}
    .mono {{ font: 700 14px/1 ui-monospace, Menlo, monospace; fill: {BLUE}; }}
    .track {{ animation: slide var(--d) linear infinite; }}
    .track-1 {{ animation-direction: reverse; }}
    @keyframes slide {{ from {{ transform: translateX(0); }} to {{ transform: translateX(calc(-1 * var(--w))); }} }}
    @media (prefers-reduced-motion: reduce) {{ .track {{ animation: none; }} }}
    .fade-l {{ fill: url(#fl); }} .fade-r {{ fill: url(#fr); }}
  </style>"""
    defs = (
        '<defs>'
        '<linearGradient id="fl" x1="0" x2="1"><stop offset="0" stop-color="var(--bg)"/><stop offset="1" stop-color="var(--bg)" stop-opacity="0"/></linearGradient>'
        '<linearGradient id="fr" x1="0" x2="1"><stop offset="0" stop-color="var(--bg)" stop-opacity="0"/><stop offset="1" stop-color="var(--bg)"/></linearGradient>'
        f'<clipPath id="clip"><rect x="0" y="0" width="{width}" height="{total_h}" rx="16"/></clipPath>'
        "</defs>"
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{total_h}" viewBox="0 0 {width} {total_h}" role="img" '
        f'aria-label="Stack: {esc(", ".join(label for _g, items in groups for label, *_ in items))}">'
        f"{style}{defs}"
        f'<rect class="bg" width="{width}" height="{total_h}" rx="16"/>'
        f'<g clip-path="url(#clip)">{"".join(out)}'
        f'<rect class="fade-l" x="0" y="0" width="60" height="{total_h}"/>'
        f'<rect class="fade-r" x="{width - 60}" y="0" width="60" height="{total_h}"/></g>'
        "</svg>\n"
    )


def build_skills(fetch: Fetcher) -> str:
    groups = []
    for group, items in SKILL_GROUPS:
        groups.append((group, [(label, slug, color, fetch_icon_path(fetch, slug)) for label, slug, color in items]))
    return skills_svg(groups)


# ───────────────────────── main ─────────────────────────


def update(fetch: Fetcher = default_fetch) -> dict[str, Any]:
    text = README.read_text(encoding="utf-8")
    result: dict[str, Any] = {"projects": 0, "posts": 0, "skills": False, "warnings": []}

    try:
        projects = fetch_projects(fetch)
        if projects:
            text = replace_section(text, PROJECTS_START, PROJECTS_END, render_projects(projects))
            result["projects"] = len(projects)
        else:
            result["warnings"].append("no projects found on /projects/")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as exc:
        result["warnings"].append(f"projects: {exc}")

    try:
        posts = fetch_posts(fetch)
        if posts:
            text = replace_section(text, POSTS_START, POSTS_END, render_posts(posts))
            result["posts"] = len(posts)
        else:
            result["warnings"].append("no posts returned by REST")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as exc:
        result["warnings"].append(f"posts: {exc}")

    svg = build_skills(fetch)
    if "<path" in svg:
        SKILLS_SVG.parent.mkdir(parents=True, exist_ok=True)
        SKILLS_SVG.write_text(svg, encoding="utf-8")
        result["skills"] = True
    else:
        result["warnings"].append("skills: no icons fetched; kept the existing banner")

    README.write_text(text, encoding="utf-8")
    return result


def main() -> None:
    result = update()
    print(f"Updated README site blocks: {result['projects']} projects, {result['posts']} posts, skills={'yes' if result['skills'] else 'kept'}.")
    for warning in result["warnings"]:
        print(f"warning: {warning}", file=sys.stderr)


if __name__ == "__main__":
    main()
