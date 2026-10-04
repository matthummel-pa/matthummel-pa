#!/usr/bin/env python3
"""Build the README header graphics: a left-aligned hero and link buttons.

GitHub strips CSS from README markup, so typography and button styling live in
SVGs under assets/ui/. Each button is its own SVG wrapped in a link in the README.
Colors follow prefers-color-scheme inside the SVG; the hero cycles the role lines
with a CSS animation that stops under prefers-reduced-motion.

Run once after editing: python3 .github/scripts/build-header.py
"""

from __future__ import annotations

import html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "ui"

NAVY = "#0d2e57"
BLUE = "#2c5a95"
SKY = "#4f8fd4"
INK = "#0f1c2e"
MUTED = "#5b6b7f"

FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, Helvetica, Arial, sans-serif'
MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

NAME = "Matt Hummel"
ROLES = [
    "Full-stack web developer",
    "Custom WordPress on the Roots stack",
    "Bedrock · Sage 11 · Trellis · Tailwind CSS",
    "Microsoft Power Platform — Power Apps · Power Automate",
    "Open for freelance, contract, or full-time",
]
TAGLINE_LINES = ["I build WordPress platforms shops can run themselves,", "and Power Apps and flows for teams that live in Microsoft 365."]
TAGLINE = " ".join(TAGLINE_LINES)
META = ["Gettysburg, PA", "Remote anywhere", "America/New_York", "PHP 8.3"]

ICONS = {
    "mail": "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.5l8 5 8-5V6H4zm16 3-8 5-8-5v9h16V9z",
    "pen": "M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z",
    "grid": "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
    "code": "m16 18 6-6-6-6M8 6l-6 6 6 6",
    "linkedin": "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z",
    "github": "M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 6.7 18 7 18 7c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z",
}

STYLE_VARS = """
    :root { --bg: transparent; --ink: %(ink)s; --muted: %(muted)s; --navy: %(navy)s; --onnavy: #ffffff; --blue: %(blue)s; --sky: %(sky)s; --line: #d7e0ea; --chip: #f1f5fa; }
    @media (prefers-color-scheme: dark) { :root { --ink: #e6edf3; --muted: #9aa7b8; --navy: #7fb2ff; --onnavy: #0b1220; --blue: #93c5fd; --sky: #bfdbfe; --line: #30363d; --chip: #161b22; } }
""" % {"ink": INK, "muted": MUTED, "navy": NAVY, "blue": BLUE, "sky": SKY}


def hero_svg() -> str:
    width, height = 900, 232
    n = len(ROLES)
    per = 3.2
    total = per * n
    lines = []
    for i, role in enumerate(ROLES):
        lines.append(
            f'<text class="role" style="animation-delay:{i * per:.1f}s" x="0" y="96">{html.escape(role)}</text>'
        )
    chips = []
    x = 0
    for label in META:
        w = 10 * len(label) + 26
        chips.append(
            f'<g transform="translate({x},176)"><rect width="{w}" height="30" rx="15" class="chip"/>'
            f'<circle cx="15" cy="15" r="3.5" class="dot"/>'
            f'<text x="26" y="20" class="chipt">{html.escape(label)}</text></g>'
        )
        x += w + 10
    keyframes = (
        "@keyframes cycle {"
        f" 0%, {100 / total * 0.3:.2f}% {{ opacity: 0; transform: translateY(8px); }}"
        f" {100 / total * 0.9:.2f}%, {100 / total * (per - 0.5):.2f}% {{ opacity: 1; transform: translateY(0); }}"
        f" {100 / total * per:.2f}%, 100% {{ opacity: 0; transform: translateY(-8px); }} }}"
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(NAME)} — {html.escape(ROLES[0])}. {html.escape(TAGLINE)}">
  <style>{STYLE_VARS}
    .hi {{ font: 600 15px/1 {FONT}; fill: var(--blue); letter-spacing: .14em; text-transform: uppercase; }}
    .name {{ font: 800 52px/1 {FONT}; fill: var(--ink); letter-spacing: -.035em; }}
    .role {{ font: 600 22px/1 {FONT}; fill: var(--navy); letter-spacing: -.01em; opacity: 0; animation: cycle {total:.1f}s ease-in-out infinite; transform-origin: 0 0; }}
    .tag {{ font: 400 16px/1.5 {FONT}; fill: var(--muted); }}
    .chip {{ fill: var(--chip); stroke: var(--line); }}
    .dot {{ fill: var(--sky); }}
    .chipt {{ font: 600 13px/1 {FONT}; fill: var(--ink); }}
    .bar {{ fill: url(#g); }}
    {keyframes}
    @media (prefers-reduced-motion: reduce) {{ .role {{ animation: none; opacity: 0; }} .role:first-of-type {{ opacity: 1; }} }}
  </style>
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="{NAVY}"/><stop offset="1" stop-color="{SKY}"/></linearGradient></defs>
  <text class="hi" x="0" y="18">Hi, I’m</text>
  <text class="name" x="-3" y="66">{html.escape(NAME)}</text>
  <rect class="bar" x="0" y="76" width="64" height="4" rx="2"/>
  {''.join(lines)}
  <text class="tag" x="0" y="130">{html.escape(TAGLINE_LINES[0])}</text>
  <text class="tag" x="0" y="154">{html.escape(TAGLINE_LINES[1])}</text>
  {''.join(chips)}
</svg>
'''


def button_svg(label: str, icon: str, primary: bool) -> str:
    w = 11 * len(label) + 58
    h = 40
    fill = "var(--navy)" if primary else "var(--chip)"
    text = "var(--onnavy)" if primary else "var(--ink)"
    stroke = "var(--navy)" if primary else "var(--line)"
    path = ICONS[icon]
    stroke_icon = icon in ("pen", "code", "grid")
    icon_svg = (
        f'<path d="{path}" fill="none" stroke="{text}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        if stroke_icon
        else f'<path d="{path}" fill="{text}"/>'
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{html.escape(label)}">
  <style>{STYLE_VARS}
    .b {{ fill: {fill}; stroke: {stroke}; stroke-width: 1.25; }}
    .l {{ font: 650 15px/1 {FONT}; fill: {text}; letter-spacing: -.005em; }}
  </style>
  <rect class="b" x="0.75" y="0.75" width="{w - 1.5}" height="{h - 1.5}" rx="{(h - 1.5) / 2}"/>
  <g transform="translate(16,11) scale(0.75)">{icon_svg}</g>
  <text class="l" x="42" y="25">{html.escape(label)}</text>
</svg>
'''


BUTTONS = [
    ("hire", "Hire me", "mail", True),
    ("note", "Write a note", "pen", False),
    ("projects", "Projects", "grid", False),
    ("code", "Code & repos", "code", False),
    ("linkedin", "LinkedIn", "linkedin", False),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "hero.svg").write_text(hero_svg(), encoding="utf-8")
    for slug, label, icon, primary in BUTTONS:
        (OUT / f"btn-{slug}.svg").write_text(button_svg(label, icon, primary), encoding="utf-8")
    print(f"Wrote hero.svg and {len(BUTTONS)} buttons to {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
