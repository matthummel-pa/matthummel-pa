#!/usr/bin/env python3
"""Tests for the profile README activity generator and link rules."""

from __future__ import annotations

import datetime as dt
import importlib.util
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / ".github" / "scripts" / "update-activity.py"


def load_mod():
    spec = importlib.util.spec_from_file_location("update_activity", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


class ContributionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.mod = load_mod()

    def test_parse_weekday_row_calendar(self) -> None:
        html = """
        <td data-date="2026-09-20" data-level="2"></td>
        <tool-tip>2 contributions on September 20th.</tool-tip>
        <td data-date="2026-09-21" data-level="0"></td>
        <tool-tip>No contributions on September 21st.</tool-tip>
        """
        days = self.mod.parse_contribution_html(html)
        self.assertEqual(days[0]["date"], "2026-09-20")
        self.assertEqual(days[0]["count"], 2)
        self.assertEqual(days[1]["count"], 0)

    def test_weeks_pad_from_sunday(self) -> None:
        days = [
            {"date": "2026-09-22", "count": 1, "level": 1},  # Tuesday
            {"date": "2026-09-23", "count": 0, "level": 0},
        ]
        weeks = self.mod.weeks_from_days(days)
        self.assertEqual(len(weeks[0]), 7)
        self.assertEqual(weeks[0][2]["date"], "2026-09-22")

    def test_heatmap_uses_navy_scale(self) -> None:
        weeks = [[{"date": "2026-09-22", "count": 4, "level": 4}] + [{"date": "", "count": 0, "level": 0}] * 6]
        svg = self.mod.heatmap_svg(weeks, total=4, year_total=1214)
        self.assertIn("#0d2e57", svg)
        self.assertIn("newest week left", svg)
        self.assertGreaterEqual(int(re.search(r'width="(\d+)"', svg).group(1)), 420)


class ActivityRenderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.mod = load_mod()
        self.now = dt.datetime(2026, 9, 22, 12, 0, tzinfo=dt.timezone.utc)

    def test_relative_time(self) -> None:
        iso = "2026-09-22T10:00:00Z"
        self.assertEqual(self.mod.relative_time(iso, self.now), "2h")

    def test_activity_table_markdown(self) -> None:
        md = self.mod.render_activity_table(
            [
                {
                    "icon": "✅",
                    "verb": "Merged PR #78",
                    "title": "restore the Gutenberg color picker",
                    "url": "https://github.com/matthummel-pa/wp-acreline/pull/78",
                    "repo": "matthummel-pa/wp-acreline",
                    "date": "2026-09-22T08:00:00Z",
                }
            ],
            now=self.now,
        )
        self.assertIn("wp-acreline", md)
        self.assertIn("Merged PR #78", md)
        self.assertIn("4h", md)
        self.assertNotIn("hummelwp", md)

    def test_replace_section(self) -> None:
        text = "A\n<!--START_SECTION:activity-->\nold\n<!--END_SECTION:activity-->\nB"
        out = self.mod.replace_section(text, "<!--START_SECTION:activity-->", "<!--END_SECTION:activity-->", "new")
        self.assertIn("new", out)
        self.assertNotIn("old", out)


class ReadmeContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.text = (ROOT / "README.md").read_text(encoding="utf-8")

    def test_no_hummelwp_hosts(self) -> None:
        self.assertNotRegex(self.text, r"https?://[^\s)]*hummelwp", msg="Live links must not use hummelwp")

    def test_demo_subdomains(self) -> None:
        self.assertIn("https://acreline.matthummel.com/", self.text)
        self.assertIn("https://walkridge.matthummel.com/", self.text)
        self.assertIn("https://matthummel.com/projects/acreline/", self.text)
        self.assertIn("https://matthummel.com/projects/walkridge/", self.text)

    def test_activity_markers(self) -> None:
        for marker in (
            "<!--START_SECTION:heatmap-->",
            "<!--START_SECTION:activity-->",
            "<!--START_SECTION:pushed-->",
        ):
            self.assertIn(marker, self.text)

    def test_game_player_present(self) -> None:
        self.assertIn("Git Blocks", self.text)
        self.assertIn("matthummel.com/git-blocks", self.text)
        self.assertIn("git-blocks-player.svg", self.text)

    def test_dev_to_handle(self) -> None:
        self.assertIn("dev.to/matthummeldev", self.text)
        self.assertNotIn("mattbuildsapps", self.text)


class EndToEndUpdateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.mod = load_mod()

    def test_update_with_stub_fetch(self) -> None:
        html = """
        <h2>12 contributions in the last year</h2>
        <td data-date="2026-09-20" data-level="3"></td>
        <tool-tip>3 contributions on September 20th.</tool-tip>
        <td data-date="2026-09-21" data-level="1"></td>
        <tool-tip>1 contribution on September 21st.</tool-tip>
        """

        def fetch(url: str):
            if "/contributions" in url:
                return html
            if "search/commits" in url:
                return {
                    "items": [
                        {
                            "sha": "abc",
                            "html_url": "https://github.com/matthummel-pa/wp-acreline/commit/abc",
                            "repository": {"full_name": "matthummel-pa/wp-acreline"},
                            "commit": {
                                "message": "Update theme purchase and demo links",
                                "author": {"date": "2026-09-22T01:00:00Z"},
                            },
                        }
                    ]
                }
            if "search/issues" in url:
                return {
                    "items": [
                        {
                            "title": "mobile menu",
                            "number": 81,
                            "state": "open",
                            "html_url": "https://github.com/matthummel-pa/wp-acreline/pull/81",
                            "repository_url": "https://api.github.com/repos/matthummel-pa/wp-acreline",
                            "updated_at": "2026-09-22T00:25:00Z",
                            "pull_request": {},
                        }
                    ]
                }
            if "/events/public" in url:
                return [
                    {
                        "id": "1",
                        "type": "WatchEvent",
                        "created_at": "2026-09-21T12:00:00Z",
                        "repo": {"name": "matthummel-pa/wp-walkridge"},
                        "payload": {},
                    }
                ]
            if "/users/matthummel-pa/repos" in url:
                return [
                    {
                        "name": "wp-acreline",
                        "html_url": "https://github.com/matthummel-pa/wp-acreline",
                        "description": "Real estate Sage theme",
                        "language": "PHP",
                        "stargazers_count": 0,
                        "pushed_at": "2026-09-22T00:00:00Z",
                        "fork": False,
                    }
                ]
            raise AssertionError(url)

        original = (ROOT / "README.md").read_text(encoding="utf-8")
        heatmap = ROOT / "assets" / "activity-heatmap.svg"
        previous_svg = heatmap.read_text(encoding="utf-8") if heatmap.exists() else None
        try:
            result = self.mod.update(fetch)
            self.assertGreaterEqual(result["activity"], 1)
            readme = (ROOT / "README.md").read_text(encoding="utf-8")
            self.assertIn("wp-acreline", readme)
            self.assertIn("activity-heatmap.svg", readme)
            self.assertTrue(heatmap.exists())
            self.assertIn("#0d2e57", heatmap.read_text(encoding="utf-8"))
            self.assertIsNone(
                __import__("re").search(r"https?://[^\s)]*hummelwp", readme),
                "Live links must not use hummelwp",
            )
            self.assertNotIn("hummelwp", readme.lower())
        finally:
            (ROOT / "README.md").write_text(original, encoding="utf-8")
            if previous_svg is None:
                if heatmap.exists():
                    heatmap.unlink()
            else:
                heatmap.write_text(previous_svg, encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
