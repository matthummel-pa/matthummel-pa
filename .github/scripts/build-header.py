#!/usr/bin/env python3
"""Build the README header graphics: the hero panel and the link buttons.

GitHub strips CSS from README markup, so typography and button styling live in
SVGs under assets/ui/. Each button is its own SVG wrapped in a link in the README.

The look mirrors matthummel.com (theme 3.8.x):
- Hero: the home "Code collage" header — dark navy gradient (blue-800 → blue-900),
  faint dot grid, glass kicker pill, blue→cyan→lime gradient name, cyan mono role
  line with a rule, light lede, and the 4px brand rule along the bottom edge. It is
  dark in both color schemes, like the site header over the hero.
- Buttons: the nav "Get updates" pill — navy fill, blue→cyan→lime ring, 999px,
  ink type, cyan icon. Secondary buttons keep the ring on a page-surface fill and
  follow prefers-color-scheme (html.mh-dark values).
The hero cycles the role lines with a CSS animation that stops under
prefers-reduced-motion.

Run once after editing: python3 .github/scripts/build-header.py
"""

from __future__ import annotations

import html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "ui"

# Site tokens (resources/css/theme-tokens.css, studio.css, site-extras.css).
BLUE_500 = "#1d6fe0"
BLUE_900 = "#071a33"
BLUE_800 = "#0b2a52"
BLUE_700 = "#1444a8"
GRAY_700 = "#2f3a4d"
HU_NAVY = "#0a1a33"
HU_INK = "#f1f5fb"
HU_BLUE = "#3b82f6"
HU_CYAN = "#22d3ee"
HU_LIME = "#a3e635"

FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
BODY = '"IBM Plex Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

# Home-hero tokens (hero-collage.css, studio.css brand layer).
HERO_BLUE_800 = "#0a1a33"
HERO_BLUE_900 = "#050d1c"
HERO_DEEP = "#040b18"
HERO_INK = "#ffffff"
HERO_LEDE = "#c9d9ef"
HERO_CYAN_300 = "#67e8f9"
HERO_BLUE_400 = "#60a5fa"
HERO_CYAN_400 = "#22d3ee"
HERO_LIME_300 = "#bef264"
HERO_PILL = "rgba(10, 26, 51, .94)"
HERO_PILL_LINE = "rgba(143, 189, 240, .22)"
HERO_PILL_INK = "#93c5fd"
MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'

NAME = "Matt Hummel"
KICKER = "I build sites your team can run"
# Mono tagline under the name, like the site's "CODE. · SHIP. · AUTOMATE." line. Cycles.
ROLES = [
    "WordPress developer",
    "Themes · Plugins · Web apps",
    "Roots stack · Sage 11 · Tailwind CSS v4",
    "Fast · Accessible · Editable by the shop",
    "Open for freelance, contract, or full-time",
]
TAGLINE_LINES = [
    "I build fast, accessible WordPress sites, themes, and plugins",
    "for shops, inns, tours, real estate agents, and agencies.",
]
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

# Light = site default; dark = html.mh-dark values from studio.css.
STYLE_VARS = f"""
    :root {{
      --panel: #ffffff; --panel-line: rgba(7, 26, 51, .10); --accent: {BLUE_500};
      --kick-bg: {BLUE_800}; --kick-ink: #ffffff;
      --name: {BLUE_900}; --role: {GRAY_700}; --lede: {GRAY_700};
      --pill: #eef4fc; --pill-line: #dbe9fa; --pill-ink: {BLUE_800};
      --btn-surface: #ffffff; --btn-surface-ink: {HU_NAVY};
    }}
    @media (prefers-color-scheme: dark) {{ :root {{
      --panel: #141c28; --panel-line: #243041; --accent: {HU_BLUE};
      --kick-bg: {BLUE_700}; --kick-ink: #ffffff;
      --name: #ffffff; --role: #c5d0de; --lede: #c5d0de;
      --pill: #172233; --pill-line: #243041; --pill-ink: #93c5fd;
      --btn-surface: #111a28; --btn-surface-ink: {HU_INK};
    }} }}
"""

# The brand ring every site button wears: blue → cyan → lime.
RING_GRADIENT = (
    f'<linearGradient id="ring" x1="0" x2="1" y1="0" y2="0">'
    f'<stop offset="0" stop-color="{HU_BLUE}"/><stop offset=".52" stop-color="{HU_CYAN}"/>'
    f'<stop offset="1" stop-color="{HU_LIME}"/></linearGradient>'
)


def hero_svg() -> str:
    """The dark home header: navy gradient, dot grid, gradient name, cyan mono role line."""
    width, height = 900, 300
    pad = 36
    n = len(ROLES)
    per = 3.2
    total = per * n

    # Role line: a short cyan rule, then the cycling mono text (site: .h-hero__role::before).
    role_y = 166
    rule_w = 36
    role_x = pad + rule_w + 14
    lines = []
    for i, role in enumerate(ROLES):
        lines.append(
            f'<text class="role" style="animation-delay:{i * per:.1f}s" x="{role_x}" y="{role_y}">{html.escape(role)}</text>'
        )

    chips = []
    x = pad
    for label in META:
        w = 10 * len(label) + 30
        chips.append(
            f'<g transform="translate({x},244)"><rect width="{w}" height="30" rx="15" class="pill"/>'
            f'<circle cx="15" cy="15" r="3.5" class="dot"/>'
            f'<text x="26" y="19.5" class="pillt">{html.escape(label)}</text></g>'
        )
        x += w + 10

    kick_w = round(7.4 * len(KICKER) + 48)

    keyframes = (
        "@keyframes cycle {"
        f" 0%, {100 / total * 0.3:.2f}% {{ opacity: 0; transform: translateY(8px); }}"
        f" {100 / total * 0.9:.2f}%, {100 / total * (per - 0.5):.2f}% {{ opacity: 1; transform: translateY(0); }}"
        f" {100 / total * per:.2f}%, 100% {{ opacity: 0; transform: translateY(-8px); }} }}"
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(NAME)} — {html.escape(ROLES[0])}. {html.escape(TAGLINE)}">
  <style>
    .kick {{ fill: rgba(255, 255, 255, .08); stroke: rgba(255, 255, 255, .35); stroke-width: 1; }}
    .kickt {{ font: 700 12px/1 {FONT}; fill: {HERO_INK}; letter-spacing: .08em; text-transform: uppercase; }}
    .name {{ font: 900 58px/1 {FONT}; fill: url(#head); letter-spacing: -.045em; }}
    .role {{ font: 500 15px/1 {MONO}; fill: {HERO_CYAN_300}; letter-spacing: .26em; text-transform: uppercase; opacity: 0; animation: cycle {total:.1f}s ease-in-out infinite; transform-origin: 0 0; }}
    .role-rule {{ fill: url(#rolerule); }}
    .lede {{ font: 400 17px/1.5 {BODY}; fill: {HERO_LEDE}; }}
    .pill {{ fill: {HERO_PILL}; stroke: {HERO_PILL_LINE}; stroke-width: 1; }}
    .dot {{ fill: {HERO_CYAN_400}; }}
    .pillt {{ font: 700 13px/1 {FONT}; fill: {HERO_PILL_INK}; }}
    .brand-rule {{ fill: url(#ring); }}
    {keyframes}
    @media (prefers-reduced-motion: reduce) {{ .role {{ animation: none; opacity: 0; }} .role:first-of-type {{ opacity: 1; }} }}
  </style>
  <defs>
    {RING_GRADIENT}
    <!-- Hero background: linear-gradient(160deg, blue-800, blue-900 60%, #040b18) -->
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{HERO_BLUE_800}"/><stop offset=".6" stop-color="{HERO_BLUE_900}"/><stop offset="1" stop-color="{HERO_DEEP}"/>
    </linearGradient>
    <!-- Soft glows: blue at top-left, teal at bottom-right (same as the site's collage hero) -->
    <radialGradient id="glow-blue" cx="0" cy="0" r="1" gradientUnits="objectBoundingBox" gradientTransform="translate(.1 .12) scale(.45 .55)">
      <stop offset="0" stop-color="#1d6fe0" stop-opacity=".28"/><stop offset=".7" stop-color="#1d6fe0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-teal" cx="0" cy="0" r="1" gradientUnits="objectBoundingBox" gradientTransform="translate(.92 .9) scale(.45 .55)">
      <stop offset="0" stop-color="#0e8a7c" stop-opacity=".22"/><stop offset=".7" stop-color="#0e8a7c" stop-opacity="0"/>
    </radialGradient>
    <!-- Name: the brand blue → cyan → lime heading gradient -->
    <linearGradient id="head" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="{HERO_BLUE_400}"/><stop offset=".55" stop-color="{HERO_CYAN_400}"/><stop offset="1" stop-color="{HERO_LIME_300}"/>
    </linearGradient>
    <linearGradient id="rolerule" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="{HERO_CYAN_300}" stop-opacity="0"/><stop offset="1" stop-color="{HERO_CYAN_300}"/>
    </linearGradient>
    <!-- 22px dot grid from .h-collage__grid -->
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#8cb4ff" fill-opacity=".11"/></pattern>
    <clipPath id="panel-clip"><rect x="0" y="0" width="{width}" height="{height}" rx="18"/></clipPath>
  </defs>
  <g clip-path="url(#panel-clip)">
    <rect x="0" y="0" width="{width}" height="{height}" fill="url(#sky)"/>
    <rect x="0" y="0" width="{width}" height="{height}" fill="url(#dots)"/>
    <rect x="0" y="0" width="{width}" height="{height}" fill="url(#glow-blue)"/>
    <rect x="0" y="0" width="{width}" height="{height}" fill="url(#glow-teal)"/>
    <!-- 4px brand rule along the bottom edge, like .post-hero::after -->
    <rect class="brand-rule" x="0" y="{height - 4}" width="{width}" height="4"/>
  </g>
  <!-- Kicker pill -->
  <g transform="translate({pad},30)"><rect class="kick" x=".5" y=".5" width="{kick_w}" height="28" rx="14"/><circle class="dot" cx="16" cy="14.5" r="3.5"/><text class="kickt" x="28" y="19">{html.escape(KICKER)}</text></g>
  <text class="name" x="{pad - 3}" y="124">{html.escape(NAME)}</text>
  <rect class="role-rule" x="{pad}" y="{role_y - 6}" width="{rule_w}" height="2" rx="1"/>
  {''.join(lines)}
  <text class="lede" x="{pad}" y="202">{html.escape(TAGLINE_LINES[0])}</text>
  <text class="lede" x="{pad}" y="226">{html.escape(TAGLINE_LINES[1])}</text>
  {''.join(chips)}
</svg>
'''


def button_svg(label: str, icon: str, primary: bool) -> str:
    # 3px of air on every side for the cyan halo (box-shadow 0 0 0 3px on the site).
    halo = 3
    # Compact: five buttons must sit on one line under the 900px hero (~660px total).
    pill_h = 32
    w = 8 * len(label) + 46 + halo * 2
    h = pill_h + halo * 2
    fill = HU_NAVY if primary else "var(--btn-surface)"
    text = HU_INK if primary else "var(--btn-surface-ink)"
    halo_alpha = ".10" if primary else ".08"
    path = ICONS[icon]
    stroke_icon = icon in ("pen", "code", "grid")
    icon_svg = (
        f'<path d="{path}" fill="none" stroke="{HU_CYAN}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
        if stroke_icon
        else f'<path d="{path}" fill="{HU_CYAN}"/>'
    )
    inset = halo + 0.75  # ring stroke is 1.5px, centered on the edge
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{html.escape(label)}">
  <style>{STYLE_VARS}
    .halo {{ fill: none; stroke: {HU_CYAN}; stroke-opacity: {halo_alpha}; stroke-width: 3; }}
    .b {{ fill: {fill}; stroke: url(#ring); stroke-width: 1.5; }}
    .l {{ font: 700 13px/1 {FONT}; fill: {text}; letter-spacing: .02em; }}
  </style>
  <defs>{RING_GRADIENT}</defs>
  <rect class="halo" x="{halo - 1.5}" y="{halo - 1.5}" width="{w - (halo - 1.5) * 2}" height="{h - (halo - 1.5) * 2}" rx="{(h - (halo - 1.5) * 2) / 2}"/>
  <rect class="b" x="{inset}" y="{inset}" width="{w - inset * 2}" height="{h - inset * 2}" rx="{(h - inset * 2) / 2}"/>
  <g transform="translate({13 + halo},{9 + halo}) scale(0.6)">{icon_svg}</g>
  <text class="l" x="{33 + halo}" y="{20.5 + halo}">{html.escape(label)}</text>
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
