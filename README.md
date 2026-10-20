<a href="https://matthummel.com/"><img src="./assets/ui/hero.svg" width="900" alt="Matt Hummel — full-stack web developer. Custom WordPress on the Roots stack (Bedrock, Sage 11, Trellis) and Microsoft Power Platform. Gettysburg, PA, remote anywhere." /></a>

<a href="https://matthummel.com/hire/"><img src="./assets/ui/btn-hire.svg" height="40" alt="Hire me" /></a>&nbsp;
<a href="https://matthummel.com/contact/"><img src="./assets/ui/btn-note.svg" height="40" alt="Write a note" /></a>&nbsp;
<a href="https://matthummel.com/projects/"><img src="./assets/ui/btn-projects.svg" height="40" alt="Projects" /></a>&nbsp;
<a href="https://matthummel.com/code/"><img src="./assets/ui/btn-code.svg" height="40" alt="Code and repos" /></a>&nbsp;
<a href="https://www.linkedin.com/in/matt-hummel-pa"><img src="./assets/ui/btn-linkedin.svg" height="40" alt="LinkedIn" /></a>

<sub><a href="#build">What I build</a> · <a href="#stack">Stack</a> · <a href="#projects">Latest projects</a> · <a href="#writing">Journal</a> · <a href="#oss">Open source</a> · <a href="#play">Branchborne</a> · <a href="#activity">Activity</a> · <a href="#devs">How I work</a> · <a href="#hire">Hire</a> · <a href="#connect">Connect</a> &nbsp;·&nbsp; <img src="https://visitor-badge.laobi.icu/badge?page_id=matthummel-pa.matthummel-pa&left_text=Profile%20views&left_color=%230f172a&right_color=%232c5a95" alt="Profile views" align="absmiddle" /></sub>

---

<a id="build"></a>
## What I build

<table>
  <tr>
    <td width="33%" valign="top">
      <strong>Custom WordPress on the Roots stack</strong><br />
      <sub>Bedrock · Sage 11 · Trellis · Acorn · Blade · Tailwind CSS · Vite</sub><br /><br />
      Themes and platforms that shop owners edit themselves. Core Gutenberg blocks, no page builder. Composer-managed WordPress, environment config in <code>.env</code>, Docker or Trellis for local and staging.
    </td>
    <td width="33%" valign="top">
      <strong>Plugins &amp; integrations</strong><br />
      <sub>PHP 8.3 · REST · WP-CLI · WooCommerce · GitHub Actions</sub><br /><br />
      Small plugins that do one job: bookings, SEO head output, table of contents, newsletter. Standard hooks, PHPDoc, an uninstall that uninstalls. CI builds the release zip; the site pulls it.
    </td>
    <td width="33%" valign="top">
      <strong>Microsoft Power Platform</strong><br />
      <sub>Power Apps · Power Automate · SharePoint · Dataverse</sub><br /><br />
      Canvas apps and flows for teams that already live in Microsoft 365 — from years of in-house federal agency work (walkthrough under NDA). Delegation-safe queries, named formulas, flows that fail loudly.
    </td>
  </tr>
</table>

<a id="stack"></a>
## Stack

<p align="center">
  <a href="https://matthummel.com/code/#skills">
    <img src="./assets/skills.svg" width="880" alt="Animated banner of the stack: Roots (WordPress, Sage, Bedrock, Trellis, Gutenberg, WooCommerce), languages and UI (PHP, JavaScript, TypeScript, HTML, CSS, Tailwind CSS, Sass, React, Next.js, Vite), tooling (Composer, Node.js, Docker, Git, GitHub Actions, VS Code, Laravel), Power Platform and more (Power Apps, Power Automate, n8n, Supabase, Netlify)" />
  </a>
</p>

| Core | Why it is in the kit |
| --- | --- |
| **PHP 8.3** | Themes, plugins, and the APIs around them. Typed, Pint-formatted, WordPress coding standards. |
| **JavaScript / TypeScript** | Small, server-first UI behavior; React where an app really needs it. |
| **Tailwind CSS v4** | Design tokens in CSS, utilities in Blade, no bloat shipped. |
| **Docker** | Reproducible local WordPress and CI; the same containers for every project. |
| **Composer** | Bedrock-style WordPress: core, plugins, and the theme are dependencies, not uploads. |
| **Power Apps · Power Automate** | Canvas apps and flows on SharePoint and Dataverse for Microsoft 365 teams. |

<sub>Groups mirror <a href="https://matthummel.com/code/">matthummel.com/code</a>. The banner is an SVG this repo rebuilds on a schedule — glyphs from simple-icons, animation off when your OS asks for reduced motion.</sub>

---

<a id="projects"></a>
## Latest projects

The four newest on [matthummel.com/projects](https://matthummel.com/projects/), refreshed by this repo's Actions. Sample work I built in public — not client sites. Each one has a live demo and a repo.

<!--START_SECTION:projects-->
<table>
  <tr>
    <td width="300" valign="top"><a href="https://matthummel.com/projects/cobbleandcandle/"><img src="https://matthummel.com/wp-content/themes/matthummel/resources/images/products/cobbleandcandle/01-homepage.webp" alt="Home page with live “Closed · opens 5:30pm” status, location switcher and lamplit hero" width="280" /></a></td>
    <td valign="top">
      <strong><a href="https://matthummel.com/projects/cobbleandcandle/">Cobble &amp; Candle</a></strong><br />
      <sub>WordPress theme · Restaurant · tavern · inn · v0.1.0</sub><br />
      Cobble &amp; Candle is a WordPress block theme for restaurants, taverns and inns. Guests see live “open now” hours, menus they can filter by diet, and book a table or a room. Owners set it up in a five-step wizard, import…<br />
      <sub>28 custom blocks &nbsp;·&nbsp; 4 style directions &nbsp;·&nbsp; WCAG 2.2 AA tested</sub><br />
      <a href="https://matthummel.com/projects/cobbleandcandle/">Project page</a> · <a href="https://cobbleandcandle.matthummel.com/">Live demo</a> · <a href="https://github.com/matthummel-pa/wp-cobbleandcandle">GitHub</a>
    </td>
  </tr>
  <tr>
    <td width="300" valign="top"><a href="https://matthummel.com/projects/tocguide/"><img src="https://matthummel.com/wp-content/themes/matthummel/resources/images/products/tocguide/featured.webp" alt="TOCguide block — outline from post headings" width="280" /></a></td>
    <td valign="top">
      <strong><a href="https://matthummel.com/projects/tocguide/">TOCguide</a></strong><br />
      <sub>WordPress plugin · The table of contents that reads with your… · v1.5.0</sub><br />
      TOCguide is a WordPress plugin that builds a table of contents from the headings in a post. The outline is in the first HTML. An optional Reading Guide adds section previews, read time, and study tools — no accounts…<br />
      <sub>Free download &nbsp;·&nbsp; 1.5.0 TOCguide identity &nbsp;·&nbsp; Server rendered</sub><br />
      <a href="https://matthummel.com/projects/tocguide/">Project page</a> · <a href="https://matthummel-pa.github.io/tocguide/">Live demo</a> · <a href="https://github.com/matthummel-pa/tocguide">GitHub</a>
    </td>
  </tr>
  <tr>
    <td width="300" valign="top"><a href="https://matthummel.com/projects/walkridge/"><img src="https://matthummel.com/wp-content/themes/matthummel/resources/images/products/walkridge/01-homepage.webp" alt="WalkRidge homepage — compass mark hero, featured tour cards, and guide bios" width="280" /></a></td>
    <td valign="top">
      <strong><a href="https://matthummel.com/projects/walkridge/">WalkRidge</a></strong><br />
      <sub>WordPress theme · Tours · guides · WooCommerce · v1.7.2</sub><br />
      WalkRidge is a WordPress theme for licensed-guide tour shops. Visitors browse tours, meet guides, and book online. Operators change brand, phone, and hours in Theme Settings — no code.<br />
      <sub>10 Gutenberg blocks &nbsp;·&nbsp; WooCommerce tour shop &nbsp;·&nbsp; GPL theme pack</sub><br />
      <a href="https://matthummel.com/projects/walkridge/">Project page</a> · <a href="https://walkridge.matthummel.com/">Live demo</a> · <a href="https://github.com/matthummel-pa/wp-walkridge">GitHub</a>
    </td>
  </tr>
  <tr>
    <td width="300" valign="top"><a href="https://matthummel.com/projects/acreline/"><img src="https://matthummel.com/wp-content/themes/matthummel/resources/images/products/acreline/02-listings.webp" alt="Listings grid with acreage and price filters" width="280" /></a></td>
    <td valign="top">
      <strong><a href="https://matthummel.com/projects/acreline/">Acreline</a></strong><br />
      <sub>WordPress theme · Homes · neighborhoods · local agents · v1.5.9</sub><br />
      Acreline is a WordPress theme for solo agents and small teams. Featured homes, agent bios, and showing requests sit on Gutenberg marketing pages. I built it so an office can set it up in WordPress without a page builder.<br />
      <sub>21 Gutenberg blocks &nbsp;·&nbsp; 5 setup wizard steps &nbsp;·&nbsp; 8 color styles</sub><br />
      <a href="https://matthummel.com/projects/acreline/">Project page</a> · <a href="https://acreline.matthummel.com/">Live demo</a> · <a href="https://github.com/matthummel-pa/wp-acreline">GitHub</a>
    </td>
  </tr>
</table>
<!--END_SECTION:projects-->

<p align="center"><sub><a href="https://matthummel.com/projects/">All projects</a> · <a href="https://matthummel.com/hire/">Hire me to adapt one</a></sub></p>

<a id="writing"></a>
## Latest from the journal

Five newest posts from [matthummel.com/blog](https://matthummel.com/blog/) — WordPress, the Roots stack, Power Platform, and how I actually work.

<!--START_SECTION:posts-->
<table>
  <tr>
    <td width="240" valign="top"><a href="https://matthummel.com/wordpress-7-2/"><img src="https://matthummel.com/wp-content/uploads/2026/10/wordpress-7-2-release-preview-768x403.webp" alt="WordPress 7.2 release preview graphic: ships December 8, 2026, with Ipsum, Notes suggestion mode, Secrets API, and form styles on the roadmap" width="220" /></a></td>
    <td valign="top">
      <strong><a href="https://matthummel.com/wordpress-7-2/">WordPress 7.2: Release Date, Features, and What to Test</a></strong><br />
      <sub>Oct 19, 2026</sub><br />
      WordPress 7.2 is set for December 8, 2026. See the beta schedule, the new Ipsum theme, Notes suggestion mode, the Secrets API, and how to test it.<br />
      <a href="https://matthummel.com/wordpress-7-2/">Read the post →</a>
    </td>
  </tr>
  <tr>
    <td width="240" valign="top"><a href="https://matthummel.com/claude-code-playbook-wordpress/"><img src="https://matthummel.com/wp-content/uploads/2026/10/dark-navy-graphic-reading-one-playbook-every-project-with-ch-768x403.webp" alt="Dark navy graphic reading &quot;One playbook. Every project.&quot; with chips for rules, skills, /pb:ship and Auto-synced, and a code window showing the playbook core rule file" width="220" /></a></td>
    <td valign="top">
      <strong><a href="https://matthummel.com/claude-code-playbook-wordpress/">Why I Built a Claude Code Playbook for WordPress</a></strong><br />
      <sub>Oct 15, 2026</sub><br />
      How one public repo of rules, skills and commands keeps Claude Code consistent across every WordPress project I work on, and syncs to every machine on merge.<br />
      <a href="https://matthummel.com/claude-code-playbook-wordpress/">Read the post →</a>
    </td>
  </tr>
  <tr>
    <td width="240" valign="top"><a href="https://matthummel.com/website-basics-for-new-developers-and-business-owners/"><img src="https://matthummel.com/wp-content/uploads/2026/10/website-basics-featured-768x512.webp" alt="Website basics diagram: a domain and DNS point to hosting, which holds the files and database, with a staging copy for testing updates, backups, and owner accounts." width="220" /></a></td>
    <td valign="top">
      <strong><a href="https://matthummel.com/website-basics-for-new-developers-and-business-owners/">Website Basics for New Developers and Business Owners</a></strong><br />
      <sub>Oct 13, 2026</sub><br />
      The website basics every new developer should learn and every business owner should understand: how a site works, who owns what, backups, and staging.<br />
      <a href="https://matthummel.com/website-basics-for-new-developers-and-business-owners/">Read the post →</a>
    </td>
  </tr>
  <tr>
    <td width="240" valign="top"><a href="https://matthummel.com/wordpress-mcp-adapter/"><img src="https://matthummel.com/wp-content/uploads/2026/10/wordpress-mcp-adapter-featured-768x512.png" alt="WordPress MCP Adapter diagram: Claude Code over STDIO and Cursor over HTTP connect through the MCP Adapter default server to a WordPress site&#x27;s abilities." width="220" /></a></td>
    <td valign="top">
      <strong><a href="https://matthummel.com/wordpress-mcp-adapter/">WordPress MCP Adapter: Connect Claude Code and Cursor to Your Site</a></strong><br />
      <sub>Oct 10, 2026</sub><br />
      Install the WordPress MCP Adapter, expose an ability with mcp.public, and connect Claude Code or Cursor through an Application Password. Includes the default endpoint and the safety checks…<br />
      <a href="https://matthummel.com/wordpress-mcp-adapter/">Read the post →</a>
    </td>
  </tr>
  <tr>
    <td width="240" valign="top"><a href="https://matthummel.com/acreline-wordpress-real-estate-theme-for-agents-and-brokers/"><img src="https://matthummel.com/wp-content/uploads/2026/10/acreline-home-page-listing-search-768x365.jpg" alt="Acreline WordPress real estate theme home page with a search bar to filter homes by type, price, acreage and area" width="220" /></a></td>
    <td valign="top">
      <strong><a href="https://matthummel.com/acreline-wordpress-real-estate-theme-for-agents-and-brokers/">Acreline: A WordPress Theme for Real Estate Agents and Brokers</a></strong><br />
      <sub>Oct 10, 2026</sub><br />
      Acreline is a WordPress real estate theme that helps agents and brokers show listings, book more showings and capture leads. See the demo and get in touch.<br />
      <a href="https://matthummel.com/acreline-wordpress-real-estate-theme-for-agents-and-brokers/">Read the post →</a>
    </td>
  </tr>
</table>
<!--END_SECTION:posts-->

<p align="center"><sub><a href="https://matthummel.com/blog/">All posts</a> · <a href="https://matthummel.com/feed/">RSS</a> · <a href="https://dev.to/matthummeldev">DEV.to</a></sub></p>

---

<a id="oss"></a>
## Open source

| Repo | What it is | Stack |
| --- | --- | --- |
| [wp-cobbleandcandle](https://github.com/matthummel-pa/wp-cobbleandcandle) | Block theme for restaurants, taverns, and inns: live hours, diet-filtered menus, table and room bookings with iCal sync, setup wizard. | Sage 11 · Gutenberg · Alpine.js · Tailwind |
| [wp-acreline](https://github.com/matthummel-pa/wp-acreline) | Real estate theme: searchable listings with a map, agents, showing requests, 21 Gutenberg blocks, setup wizard. | Sage 11 · Gutenberg · Customizer |
| [wp-walkridge](https://github.com/matthummel-pa/wp-walkridge) | Tour-shop theme: tours, guides, and checkout through WooCommerce. | Sage 11 · WooCommerce · Gutenberg |
| [tocguide](https://github.com/matthummel-pa/tocguide) | Server-rendered Table of Contents block with an optional Reading Guide. Free, GPLv2+. | PHP · Gutenberg |
| [repofolio](https://github.com/matthummel-pa/repofolio) | Turn GitHub repos and site projects into a living portfolio for WordPress. | PHP · GitHub API · Gutenberg |
| [matthummel-theme](https://github.com/matthummel-pa/matthummel-theme) | The theme behind matthummel.com, including the live GitHub board and the social-share editor box. | Sage 11 · Blade · Tailwind v4 · Vite |
| [branchborne-gem-quest-game](https://github.com/matthummel-pa/branchborne-gem-quest-game) | Match-3 with a web-dev twist (below). | Vanilla JS canvas · Supabase · Netlify |

<sub>Every repo follows the same rules: a one-sentence description, topics like <code>wordpress</code> · <code>roots-sage</code> · <code>php</code> · <code>powerplatform</code>, a README with setup, stack, usage, and a visual overview, conventional commits that say <em>why</em>, and a <code>.gitignore</code> that keeps <code>.env</code>, <code>wp-config.php</code>, dumps, and build output out.</sub>

<a id="play"></a>
## Branchborne Gem Quest

Bejeweled-style match-3 with a web-dev twist — tech gems, pathway heroes (Frontend Mage, Backend Sentinel, WordPress Artisan, Full-Stack Ranger), live side quests, and a trophy case. Open source and looking for collaborators.

<table>
  <tr>
    <td width="300" valign="top">
      <a href="https://gregarious-custard-70cf58.netlify.app/"><img src="./assets/branchborne-gem-quest.jpg" alt="Branchborne Gem Quest — fantasy match-3 board of glowing tech gems in an enchanted forest" width="280" /></a>
    </td>
    <td valign="top">
      Continuous cascades (HTML, CSS, JS, React, Git, Node, and more), Intern → Senior → Expert endgame, Dev tips on the quest rail, cloud saves via Supabase. Vanilla JS canvas engine plus a WordPress shortcode embed.<br /><br />
      <a href="https://gregarious-custard-70cf58.netlify.app/"><img src="https://img.shields.io/badge/▶_Play_live-0D2E57?style=for-the-badge" alt="Play Branchborne Gem Quest" /></a>
      <a href="https://github.com/matthummel-pa/branchborne-gem-quest-game"><img src="https://img.shields.io/badge/Game_repo-181717?style=for-the-badge&logo=github" alt="branchborne-gem-quest-game on GitHub" /></a><br />
      <sub><a href="https://matthummel-pa.github.io/matthummel-pa/">Pages mirror</a></sub>
    </td>
  </tr>
</table>

---

<a id="activity"></a>
## Public GitHub activity

Same idea as the live board on [matthummel.com/code](https://matthummel.com/code/): a custom 90-day heat map (newest week first, navy cells) plus the latest public pushes. Refreshed hourly from this repo's Actions — not a third-party stats card.

<!--START_SECTION:heatmap-->
<p align="center">
  <a href="https://matthummel.com/code/#gh-contributions">
    <img src="./assets/activity-heatmap.svg" width="680" alt="1523 public contributions in the last 90 days" />
  </a>
</p>

<sub>Custom calendar (not the GitHub default card). Newest week on the left, navy scale from [matthummel.com/code](https://matthummel.com/code/). 1,523 contributions in 90 days · 1,626 in the last year.</sub>
<!--END_SECTION:heatmap-->

### Feed

<!--START_SECTION:activity-->
| | Shipped | Repo | When |
| --- | --- | --- | --- |
| | ✅ [Merged PR #295](https://github.com/matthummel-pa/matthummel-theme/pull/295) — feat(footer): footer columns become widget areas (3.7.11) | [`matthummel-theme`](https://github.com/matthummel-pa/matthummel-theme) | 17m |
| | ✅ [Merged PR #294](https://github.com/matthummel-pa/matthummel-theme/pull/294) — Core blocks: one look in light and dark, editor canvas matches … | [`matthummel-theme`](https://github.com/matthummel-pa/matthummel-theme) | 15h |
| | 🚀 [Commit](https://github.com/matthummel-pa/matthummel-theme/commit/68c23979f85f01387aaf45e10a530aa752a840fe) — Release watch: rundown and banner blocks in the theme (3.7.10) | [`matthummel-theme`](https://github.com/matthummel-pa/matthummel-theme) | 12h |
| | 🚀 [Commit](https://github.com/matthummel-pa/matthummel-theme/commit/551f214cf8087390caa46c79478c98da45a3afd3) — Merge branch 'feature/blocks-one-look': core blocks one look, e… | [`matthummel-theme`](https://github.com/matthummel-pa/matthummel-theme) | 16h |
| | 🚀 [Commit](https://github.com/matthummel-pa/matthummel-theme/commit/8b4cdbc98baa1ae61b27e985803bae0b0e663bff) — Editor dark mode: menu follows storage events, choice survives … | [`matthummel-theme`](https://github.com/matthummel-pa/matthummel-theme) | 16h |
| | 🚀 [Commit](https://github.com/matthummel-pa/matthummel-theme/commit/7c0717c83b1557a666811957bbef94b76d5ac77c) — Core blocks: one look in light and dark, editor canvas matches … | [`matthummel-theme`](https://github.com/matthummel-pa/matthummel-theme) | 17h |
| | 🚀 [Commit](https://github.com/matthummel-pa/matthummel-theme/commit/254845033fc923610566ff55287f3b607a6af0c6) — Merge branch 'fix/content-audit-oct16': content audit fixes (3.… | [`matthummel-theme`](https://github.com/matthummel-pa/matthummel-theme) | 3d |
| | 🔀 [Opened PR #293](https://github.com/matthummel-pa/matthummel-theme/pull/293) — Fix review findings: escaping, security, a11y, and version drift | [`matthummel-theme`](https://github.com/matthummel-pa/matthummel-theme) | 3d |
| | 🔀 [Opened PR #5](https://github.com/matthummel-pa/ai-dev-standards-playbook/pull/5) — feat(docs): Voiceover Booth with live coaching, plus voice-over… | [`ai-dev-standards-playbook`](https://github.com/matthummel-pa/ai-dev-standards-playbook) | 5d |
| | ✅ [Merged PR #4](https://github.com/matthummel-pa/ai-dev-standards-playbook/pull/4) — docs(readme): banner, badges, section nav, mermaid diagrams, fo… | [`ai-dev-standards-playbook`](https://github.com/matthummel-pa/ai-dev-standards-playbook) | 5d |
| | ✅ [Merged PR #3](https://github.com/matthummel-pa/ai-dev-standards-playbook/pull/3) — docs: rewrite README and add GitHub Pages docs site | [`ai-dev-standards-playbook`](https://github.com/matthummel-pa/ai-dev-standards-playbook) | 5d |
| | 🏷️ [Released](https://github.com/matthummel-pa/ai-dev-standards-playbook/releases/tag/v1.0.0) — v1.0.0 | [`ai-dev-standards-playbook`](https://github.com/matthummel-pa/ai-dev-standards-playbook) | 5d |
<!--END_SECTION:activity-->

### Recently pushed

<!--START_SECTION:pushed-->
| Repo | Stack | Last push |
| --- | --- | --- |
| **[matthummel-theme](https://github.com/matthummel-pa/matthummel-theme)** — Sage 11 WordPress theme for matthummel.com — Blade, Tailwind v4, Vite. Portfolio and se… | PHP · ★1 | 17m |
| **[ai-dev-standards-playbook](https://github.com/matthummel-pa/ai-dev-standards-playbook)** — Rules, skills, slash commands and a deploy kit that teach Claude Code how to build Word… | Shell · ★0 | 5d |
| **[wpdemo-dobbinhouse](https://github.com/matthummel-pa/wpdemo-dobbinhouse)** — Public work from Gettysburg. | PHP · ★0 | 2w |
| **[tocguide](https://github.com/matthummel-pa/tocguide)** — Lightweight, server-rendered Table of Contents block for Gutenberg. TOCguide builds an … | PHP · ★1 | 2w |
<!--END_SECTION:pushed-->

<p align="center"><sub>Full calendar, badges, and repo cards: <a href="https://matthummel.com/code/">matthummel.com/code</a></sub></p>

---

<a id="devs"></a>
## How I work

Seventeen years of in-house web work (higher-ed marketing, then SharePoint / Power Platform for federal teams). Public GitHub is the trail I started in 2025 — most production code still lives behind employer walls.

| | The useful version |
| --- | --- |
| **Day job shape** | I write PHP, Blade, and just enough JS/TS. I am not a designer — I will refer one. |
| **Happy path** | Bedrock + Sage 11 + Trellis, Acorn, Blade, Tailwind v4, Vite, PHP 8.3, WordPress 6.6+, Core Gutenberg (no page builder). |
| **Plugins** | One job each. PHPDoc, standard hooks, uninstall that actually uninstalls. |
| **Power Platform** | Delegation-safe queries, named formulas, flows with error branches. SharePoint or Dataverse, whichever the team already has. |
| **AI** | Cursor + Claude scaffold. I still read, click, and test every line that ships. |
| **PRs I like** | Small, named after the change, conventional commits (`feat`, `fix`, `docs`). Tell me how you tried it. |
| **PRs I bounce** | Drive-by refactors, page-builder add-ons, and "while I was here" diffs. |
| **Handoff** | Domain, hosting, repo, and database in the client's name. Short admin notes in plain English. |
| **Agency mode** | Silent sub is fine. You keep the client. I stay off their Slack unless you ask. |
| **Hours** | America/New_York. Async first. Overlap afternoons ET for pairing. |
| **A11y** | Keyboard paths, contrast, semantic HTML. If a shop owner cannot tab it, it is not done. |

<details>
  <summary><strong>How to drop me into a repo</strong></summary>

```text
1. Node + Composer + a local WordPress (Docker, Trellis, Studio, or wp-env). PHP 8.3.
2. Theme: composer install && npm install && npm run build
3. Do not install Elementor / ACF "because the last theme had it".
4. Open a draft PR early. I review staged URLs, not zip files in Drive.
5. If it is agency overflow: send brand, IA, and who owns hosting first.
```

</details>

<details>
  <summary><strong>package.json vibes</strong></summary>

```json
{
  "name": "matt-hummel",
  "version": "17.0.0",
  "private": false,
  "description": "Full-stack web developer · Roots-stack WordPress · Power Platform · open for work",
  "homepage": "https://matthummel.com",
  "main": "WordPress + Roots (Bedrock · Sage 11 · Trellis)",
  "scripts": {
    "dev": "cursor . && coffee --watch",
    "build": "ship accessible WordPress platforms",
    "test": "a11y + Core Web Vitals + 'can the shop edit it?'",
    "play": "open https://gregarious-custard-70cf58.netlify.app/",
    "deploy": "you own the keys"
  },
  "dependencies": {
    "wordpress": "specialty",
    "roots/bedrock": "*",
    "roots/sage": "^11",
    "roots/trellis": "*",
    "php": "8.3",
    "tailwindcss": "^4",
    "docker": "*",
    "power-platform": "canvas + flows",
    "curiosity": "*",
    "patience": "^∞"
  },
  "devDependencies": {
    "claude": "coworker",
    "cursor": "pair-programmer",
    "bad-pun-generator": "optional"
  },
  "engines": {
    "node": ">=human",
    "coffee": "required",
    "timezone": "America/New_York"
  },
  "keywords": ["wordpress", "roots-sage", "php", "powerplatform", "gettysburg", "a11y", "open-for-work"],
  "license": "MIT-and-kindness"
}
```

</details>

<a id="hire"></a>
## Open for work

**Freelance · contract · full-time · agency overflow.** Custom WordPress on the Roots stack, plugins and integrations, and Power Platform solutions. Based in Gettysburg, PA. Remote anywhere. I usually reply within one business day (ET).

**[Hire me](https://matthummel.com/hire/)** · **[Write a note](https://matthummel.com/contact/)** · **[LinkedIn](https://www.linkedin.com/in/matt-hummel-pa)**

<a id="stats"></a>
## GitHub stats

<p align="center">
  <img src="https://streak-stats.demolab.com?user=matthummel-pa&theme=default&hide_border=true&ring=2C5A95&fire=2C5A95&currStreakLabel=2C5A95&sideLabels=334155&dates=64748b" alt="GitHub streak" />
</p>

<table align="center">
  <tr>
    <td valign="top" width="50%">
      <img src="https://github-readme-stats.shion.dev/api?username=matthummel-pa&show_icons=true&hide_border=true&title_color=2C5A95&icon_color=2C5A95&text_color=334155&include_all_commits=true" alt="Matt Hummel's GitHub stats" />
    </td>
    <td valign="top" width="50%">
      <img src="https://github-readme-stats.shion.dev/api/top-langs/?username=matthummel-pa&layout=compact&hide_border=true&title_color=2C5A95&text_color=334155&langs_count=8" alt="Top languages" />
    </td>
  </tr>
</table>

<a id="connect"></a>
## Connect

- 🌐 **Website:** [matthummel.com](https://matthummel.com)
- 🧪 **Live demos:** [cobbleandcandle.matthummel.com](https://cobbleandcandle.matthummel.com/) · [acreline.matthummel.com](https://acreline.matthummel.com/) · [walkridge.matthummel.com](https://walkridge.matthummel.com/)
- 📬 **Hire / contact:** [matthummel.com/hire](https://matthummel.com/hire/) · [matthummel.com/contact](https://matthummel.com/contact/)
- 🧩 **Projects + code:** [matthummel.com/projects](https://matthummel.com/projects/) · [matthummel.com/code](https://matthummel.com/code/)
- 💼 **LinkedIn:** [linkedin.com/in/matt-hummel-pa](https://www.linkedin.com/in/matt-hummel-pa)
- ✍️ **Dev.to:** [dev.to/matthummeldev](https://dev.to/matthummeldev)
- 🦋 **Bluesky:** [@matthummel](https://bsky.app/profile/matthummel.bsky.social)
- 👽 **Reddit:** [u/matt-hummel](https://www.reddit.com/user/matt-hummel)
- 📡 **RSS:** [matthummel.com/feed](https://matthummel.com/feed/)
- 🎮 **Branchborne Gem Quest:** [Play live](https://gregarious-custard-70cf58.netlify.app/) · [Game repo](https://github.com/matthummel-pa/branchborne-gem-quest-game)

<sub>Full-stack web developer · Roots-stack WordPress · Power Platform — open for work. PRs welcome; puns tolerated.</sub>
