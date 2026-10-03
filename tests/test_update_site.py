#!/usr/bin/env python3
"""Tests for the matthummel.com-driven README blocks."""

from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / ".github" / "scripts" / "update-site.py"


def load_mod():
    spec = importlib.util.spec_from_file_location("update_site", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


LISTING = """
<article\nclass="work-card"\nid="cobbleandcandle"\ndata-work-card\ndata-search="x"\n></article>
<article class="work-card" id="tocguide" data-work-card></article>
<article class="work-card" id="tocguide" data-work-card></article>
"""

PAGE = """
<h1 class="display-title is-hero">Cobble &amp; Candle</h1>
<p class="project-hero-tagline">Restaurant · tavern · inn</p>
<p class="lead">A block theme for inns. <em>No</em> page builder.</p>
<ul class="project-proof"><li class="project-proof__item"><strong>28</strong><span>custom blocks</span></li></ul>
<script type="application/json" id="pf-gallery-data">[{"src":"https://x.test/01.webp","alt":"Home page"}]</script>
<script type="application/ld+json">{"@graph":[{"@type":"SoftwareApplication","applicationSubCategory":"WordPress theme","softwareVersion":"0.1.0","sameAs":["https://github.com/matthummel-pa/wp-cobbleandcandle","https://cobbleandcandle.matthummel.com/"]}]}</script>
"""

POSTS = json.dumps(
    [
        {
            "title": {"rendered": "Cobble &amp; Candle: A Theme"},
            "link": "https://matthummel.com/post-one/",
            "date": "2026-10-03T12:00:00",
            "excerpt": {"rendered": "<p>First <b>bold</b> excerpt that runs long enough to be clipped " + "word " * 60 + "</p>"},
            "_embedded": {
                "wp:featuredmedia": [
                    {
                        "alt_text": "Alt here",
                        "source_url": "https://x.test/full.jpg",
                        "media_details": {"sizes": {"medium_large": {"source_url": "https://x.test/ml.jpg"}, "full": {"source_url": "https://x.test/full.jpg"}}},
                    }
                ]
            },
        },
        {"title": {"rendered": "No image"}, "link": "https://matthummel.com/two/", "date": "2026-09-01T00:00:00", "excerpt": {"rendered": "Short."}},
    ]
)


class ProjectTests(unittest.TestCase):
    def setUp(self) -> None:
        self.mod = load_mod()

    def test_order_is_listing_order_and_unique(self) -> None:
        self.assertEqual(self.mod.parse_project_order(LISTING), ["cobbleandcandle", "tocguide"])

    def test_page_parse(self) -> None:
        p = self.mod.parse_project_page(PAGE, "cobbleandcandle")
        self.assertEqual(p["title"], "Cobble & Candle")
        self.assertEqual(p["lead"], "A block theme for inns. No page builder.")
        self.assertEqual(p["image"], "https://x.test/01.webp")
        self.assertEqual(p["repo"], "https://github.com/matthummel-pa/wp-cobbleandcandle")
        self.assertEqual(p["demo"], "https://cobbleandcandle.matthummel.com/")
        self.assertEqual(p["kind"], "WordPress theme")
        self.assertEqual(p["proof"], ["28 custom blocks"])

    def test_render_image_left_info_right(self) -> None:
        p = self.mod.parse_project_page(PAGE, "cobbleandcandle")
        out = self.mod.render_projects([p])
        self.assertLess(out.index('<img src="https://x.test/01.webp"'), out.index("<strong>"))
        self.assertIn("Live demo", out)
        self.assertIn("GitHub", out)
        self.assertIn("v0.1.0", out)
        self.assertNotIn("matthummel-theme", out)

    def test_fetch_projects_limits_to_four(self) -> None:
        listing = "".join(f'<article class="work-card" id="p{i}" data-work-card></article>' for i in range(6))

        def fetch(url: str) -> str:
            return listing if url.endswith("/projects/") else PAGE

        self.assertEqual(len(self.mod.fetch_projects(fetch)), 4)


class PostTests(unittest.TestCase):
    def setUp(self) -> None:
        self.mod = load_mod()

    def test_parse_posts_prefers_medium_large_and_clips(self) -> None:
        posts = self.mod.parse_posts(POSTS)
        self.assertEqual(posts[0]["title"], "Cobble & Candle: A Theme")
        self.assertEqual(posts[0]["image"], "https://x.test/ml.jpg")
        self.assertEqual(posts[0]["image_alt"], "Alt here")
        self.assertTrue(posts[0]["excerpt"].endswith("…"))
        self.assertLessEqual(len(posts[0]["excerpt"]), 191)
        self.assertEqual(posts[1]["image"], "")

    def test_render_posts_table(self) -> None:
        out = self.mod.render_posts(self.mod.parse_posts(POSTS))
        self.assertEqual(out.count("<tr>"), 2)
        self.assertIn("Oct 3, 2026", out)
        self.assertLess(out.index("<img"), out.index("Cobble &amp; Candle: A Theme"))
        self.assertIn("Read the post", out)


class SkillsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.mod = load_mod()

    def test_svg_has_two_animated_rows_and_icons(self) -> None:
        groups = [("Front-end", [("HTML", "html5", "E34F26", "M0 0h24v24H0z"), ("CSS", "css", "663399", "")]), ("Ship", [("Git", "git", "F05032", "M1 1h2v2H1z")])]
        svg = self.mod.skills_svg(groups)
        self.assertIn("@keyframes slide", svg)
        self.assertIn("prefers-reduced-motion", svg)
        self.assertIn("prefers-color-scheme: dark", svg)
        self.assertEqual(svg.count('class="track track-'), 2)
        self.assertIn('fill="#E34F26"', svg)
        self.assertIn(">CS<", svg)  # text fallback when no glyph
        self.assertTrue(svg.startswith("<svg"))

    def test_groups_cover_code_page_stack(self) -> None:
        labels = {label for _g, items in self.mod.SKILL_GROUPS for label, *_ in items}
        for needed in ("HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS", "Sass", "Vite", "PHP", "WordPress", "Sage", "Bedrock", "Trellis", "Docker", "Composer", "Node.js", "Laravel", "Git", "VS Code", "Power Apps", "Power Automate", "n8n"):
            self.assertIn(needed, labels)


class SectionTests(unittest.TestCase):
    def test_replace_keeps_markers(self) -> None:
        mod = load_mod()
        text = "a\n<!--START_SECTION:posts-->\nold\n<!--END_SECTION:posts-->\nb"
        out = mod.replace_section(text, mod.POSTS_START, mod.POSTS_END, "new")
        self.assertEqual(out, "a\n<!--START_SECTION:posts-->\nnew\n<!--END_SECTION:posts-->\nb")

    def test_readme_has_markers(self) -> None:
        mod = load_mod()
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        for marker in (mod.PROJECTS_START, mod.PROJECTS_END, mod.POSTS_START, mod.POSTS_END):
            self.assertIn(marker, readme)
        self.assertNotIn("matthummel-theme/main/resources/images", readme.split("## Open source")[0])


if __name__ == "__main__":
    unittest.main()
