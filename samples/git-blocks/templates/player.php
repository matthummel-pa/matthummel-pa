<?php
/**
 * Branchborne Gem Quest player markup (shortcode template).
 *
 * @package GitBlocks
 *
 * @var string $git_blocks_layout_class
 * @var string $git_blocks_share_url
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
	exit;
}
?>
<div class="<?php echo esc_attr($git_blocks_layout_class); ?>">
	<main class="page">
		<p class="page-kicker"><?php esc_html_e('Mini player · Branchborne Gem Quest', 'git-blocks'); ?></p>
		<h1><?php esc_html_e('Branchborne Gem Quest', 'git-blocks'); ?></h1>
		<p class="page-lead"><?php esc_html_e('Bejeweled-style gem quest with live side quests, trophies, and class Expert endgame.', 'git-blocks'); ?></p>

		<section class="player" data-git-blocks aria-label="<?php esc_attr_e('Branchborne Gem Quest matching game', 'git-blocks'); ?>">
			<div class="player-chrome">
				<div class="traffic" aria-hidden="true"><span></span><span></span><span></span></div>
				<div class="player-title"><?php esc_html_e('Branchborne Gem Quest', 'git-blocks'); ?></div>
				<div class="player-actions">
					<button type="button" class="ghost" data-trophies><?php esc_html_e('Trophies', 'git-blocks'); ?></button>
					<button type="button" class="ghost" data-customize><?php esc_html_e('Customize', 'git-blocks'); ?></button>
					<button type="button" class="ghost" data-share><?php esc_html_e('Share', 'git-blocks'); ?></button>
					<button type="button" class="ghost" data-pause><?php esc_html_e('Pause', 'git-blocks'); ?></button>
					<button type="button" class="ghost" data-mute aria-pressed="false"><?php esc_html_e('Sound on', 'git-blocks'); ?></button>
				</div>
			</div>

			<div class="player-screen">
				<div class="board-column">
					<div class="board-wrap">
						<div class="dev-clouds pattern-drift" data-dev-clouds aria-hidden="true"></div>
						<canvas data-board width="480" height="480" tabindex="0" role="application" aria-label="<?php esc_attr_e('Branchborne gem board. Click a gem, then an adjacent gem to swap.', 'git-blocks'); ?>"></canvas>
						<div class="overlay is-clickable" data-overlay>
							<div>
								<p class="overlay-level" data-overlay-level hidden><?php esc_html_e('Quest 1', 'git-blocks'); ?></p>
								<h2 data-overlay-title><?php esc_html_e('Choose your pathway', 'git-blocks'); ?></h2>
								<p data-overlay-body><?php esc_html_e('Pick a class. Match gems continuously — side quests appear on the right as you play to Senior / Expert.', 'git-blocks'); ?></p>
								<button type="button" data-play hidden><?php esc_html_e('Start questing', 'git-blocks'); ?></button>
							</div>
						</div>
					</div>
					<aside class="quest-rail" data-quest-rail aria-label="<?php esc_attr_e('Live side quests', 'git-blocks'); ?>"></aside>
				</div>
				<aside class="side">
					<div class="stats-row">
						<div class="stat"><span><?php esc_html_e('Lines of code', 'git-blocks'); ?></span><strong data-score>0</strong></div>
						<div class="stat"><span><?php esc_html_e('Cleared', 'git-blocks'); ?></span><strong data-lines>0</strong></div>
						<div class="stat"><span><?php esc_html_e('Quest', 'git-blocks'); ?></span><strong data-level>1</strong></div>
						<div class="stat"><span><?php esc_html_e('Best LOC', 'git-blocks'); ?></span><strong data-high>0</strong></div>
					</div>
					<div class="stats-row compact">
						<div class="stat"><span><?php esc_html_e('Moves', 'git-blocks'); ?></span><strong data-moves>48</strong></div>
						<div class="stat"><span><?php esc_html_e('Combo', 'git-blocks'); ?></span><strong data-combo>0</strong></div>
						<div class="stat"><span><?php esc_html_e('Goal', 'git-blocks'); ?></span><strong data-goal>0/600 LOC</strong></div>
					</div>
					<p class="sprint-name" data-sprint><?php esc_html_e('Pick a pathway class', 'git-blocks'); ?></p>
					<p class="rank-line" data-rank><?php esc_html_e('Branchborne Gem Quest', 'git-blocks'); ?></p>
					<p class="path-progress" data-path-progress><?php esc_html_e('Path to Senior / class Expert', 'git-blocks'); ?></p>
					<div class="goal-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="<?php esc_attr_e('Quest LOC goal', 'git-blocks'); ?>">
						<span data-progress></span>
					</div>
					<p class="message" data-message><?php esc_html_e('Pick a pathway hero to begin.', 'git-blocks'); ?></p>
					<div class="power-row">
						<button type="button" class="ghost" data-hint><?php esc_html_e('Hint (2)', 'git-blocks'); ?></button>
						<button type="button" class="ghost" data-shuffle><?php esc_html_e('Shuffle (2)', 'git-blocks'); ?></button>
					</div>
					<div class="skills-row" data-skills aria-label="<?php esc_attr_e('Unlocked skills', 'git-blocks'); ?>"></div>
					<div class="gem-legend" data-gem-legend aria-label="<?php esc_attr_e('Gem logos', 'git-blocks'); ?>"></div>
					<ul class="commit-log" data-commit-log aria-label="<?php esc_attr_e('Match log', 'git-blocks'); ?>"></ul>
					<div class="badge-row" data-badges aria-label="<?php esc_attr_e('Achievements', 'git-blocks'); ?>"></div>
					<div class="trophy-board" data-trophy-board hidden aria-label="<?php esc_attr_e('Trophy and loot case', 'git-blocks'); ?>"></div>
					<div class="player-dock">
						<span class="controls-label"><?php esc_html_e('Continuous match · side quests · trophies', 'git-blocks'); ?></span>
						<p class="keys" data-keys-help><?php esc_html_e('Break gems · quests auto-level on the right · collect tech trophies', 'git-blocks'); ?></p>
					</div>
				</aside>
			</div>
		</section>
		<div class="sr-only" data-live aria-live="polite"></div>
	</main>
</div>
