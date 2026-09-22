<?php
/**
 * Git Blocks player markup (shortcode template).
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
		<p class="page-kicker"><?php esc_html_e('Mini player · Git Blocks', 'git-blocks'); ?></p>
		<h1><?php esc_html_e('Git Blocks', 'git-blocks'); ?></h1>
		<p class="page-lead"><?php esc_html_e('Gem-drop RPG — pick a pathway class, write lines of code, graduate to senior, then clear endgame raids.', 'git-blocks'); ?></p>

		<section class="player" data-git-blocks aria-label="<?php esc_attr_e('Git Blocks gem matching game', 'git-blocks'); ?>">
			<div class="player-chrome">
				<div class="traffic" aria-hidden="true"><span></span><span></span><span></span></div>
				<div class="player-title"><?php esc_html_e('Git Blocks', 'git-blocks'); ?></div>
				<div class="player-actions">
					<button type="button" class="ghost" data-customize><?php esc_html_e('Customize', 'git-blocks'); ?></button>
					<button type="button" class="ghost" data-share><?php esc_html_e('Share', 'git-blocks'); ?></button>
					<button type="button" class="ghost" data-pause><?php esc_html_e('Pause', 'git-blocks'); ?></button>
					<button type="button" class="ghost" data-mute aria-pressed="false"><?php esc_html_e('Sound on', 'git-blocks'); ?></button>
				</div>
			</div>

			<div class="player-screen">
				<div class="board-wrap">
					<div class="dev-clouds pattern-drift" data-dev-clouds aria-hidden="true"></div>
					<canvas data-board width="480" height="480" tabindex="0" role="application" aria-label="<?php esc_attr_e('Git Blocks gem board. Click a gem, then an adjacent gem to swap.', 'git-blocks'); ?>"></canvas>
					<div class="overlay is-clickable" data-overlay>
						<div>
							<p class="overlay-level" data-overlay-level hidden><?php esc_html_e('Lesson 1', 'git-blocks'); ?></p>
							<h2 data-overlay-title><?php esc_html_e('Choose your pathway class', 'git-blocks'); ?></h2>
							<p data-overlay-body><?php esc_html_e('Each class is a web-dev career path with affinity gems, themed clouds, and a class power — then fight endgame raids after senior.', 'git-blocks'); ?></p>
							<button type="button" data-play hidden><?php esc_html_e('Start learning', 'git-blocks'); ?></button>
						</div>
					</div>
				</div>
				<aside class="side">
					<div class="stats-row">
						<div class="stat"><span><?php esc_html_e('Lines of code', 'git-blocks'); ?></span><strong data-score>0</strong></div>
						<div class="stat"><span><?php esc_html_e('Cleared', 'git-blocks'); ?></span><strong data-lines>0</strong></div>
						<div class="stat"><span><?php esc_html_e('Lesson', 'git-blocks'); ?></span><strong data-level>1</strong></div>
						<div class="stat"><span><?php esc_html_e('Best LOC', 'git-blocks'); ?></span><strong data-high>0</strong></div>
					</div>
					<div class="stats-row compact">
						<div class="stat"><span><?php esc_html_e('Moves', 'git-blocks'); ?></span><strong data-moves>32</strong></div>
						<div class="stat"><span><?php esc_html_e('Combo', 'git-blocks'); ?></span><strong data-combo>0</strong></div>
						<div class="stat"><span><?php esc_html_e('Goal', 'git-blocks'); ?></span><strong data-goal>0/600 LOC</strong></div>
					</div>
					<p class="sprint-name" data-sprint>Pick a pathway class</p>
					<p class="rank-line" data-rank>Gem-drop RPG</p>
					<div class="goal-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="<?php esc_attr_e('Lesson LOC goal', 'git-blocks'); ?>">
						<span data-progress></span>
					</div>
					<p class="message" data-message><?php esc_html_e('Choose a pathway class to begin.', 'git-blocks'); ?></p>
					<div class="power-row">
						<button type="button" class="ghost" data-hint><?php esc_html_e('Hint (2)', 'git-blocks'); ?></button>
						<button type="button" class="ghost" data-shuffle><?php esc_html_e('Shuffle (2)', 'git-blocks'); ?></button>
					</div>
					<div class="skills-row" data-skills aria-label="<?php esc_attr_e('Unlocked skills', 'git-blocks'); ?>"></div>
					<div class="gem-legend" data-gem-legend aria-label="<?php esc_attr_e('Gem logos', 'git-blocks'); ?>"></div>
					<ul class="commit-log" data-commit-log aria-label="<?php esc_attr_e('Match log', 'git-blocks'); ?>"></ul>
					<div class="badge-row" data-badges aria-label="<?php esc_attr_e('Achievements', 'git-blocks'); ?>"></div>
					<div class="player-dock">
						<span class="controls-label"><?php esc_html_e('Path to senior · then raids', 'git-blocks'); ?></span>
						<p class="keys" data-keys-help><?php esc_html_e('Pick class · match affinity · fill mana · cast power · H hint', 'git-blocks'); ?></p>
					</div>
				</aside>
				<div class="customize-panel" data-customize-panel hidden>
					<div class="customize-head">
						<h3><?php esc_html_e('Customize', 'git-blocks'); ?></h3>
						<button type="button" class="ghost" data-customize-close aria-label="<?php esc_attr_e('Close customize', 'git-blocks'); ?>"><?php esc_html_e('Close', 'git-blocks'); ?></button>
					</div>
					<div class="customize-tabs" role="tablist">
						<button type="button" class="is-active" data-tab="look" role="tab" aria-selected="true"><?php esc_html_e('Look', 'git-blocks'); ?></button>
						<button type="button" data-tab="music" role="tab" aria-selected="false"><?php esc_html_e('Music', 'git-blocks'); ?></button>
						<button type="button" data-tab="share" role="tab" aria-selected="false"><?php esc_html_e('Share', 'git-blocks'); ?></button>
					</div>

					<section class="customize-pane is-active" data-pane="look">
						<p class="customize-hint"><?php esc_html_e('Pick a CSS backdrop, paste a gradient, or load a custom image URL.', 'git-blocks'); ?></p>
						<div class="bg-presets" data-bg-presets></div>
						<label class="field inline">
							<span><?php esc_html_e('Graphics', 'git-blocks'); ?></span>
							<select data-graphics>
								<option value="advanced"><?php esc_html_e('Advanced', 'git-blocks'); ?></option>
								<option value="simple"><?php esc_html_e('Simple', 'git-blocks'); ?></option>
							</select>
						</label>
						<label class="field">
							<span><?php esc_html_e('Custom CSS background', 'git-blocks'); ?></span>
							<textarea data-bg-css rows="3" placeholder="linear-gradient(135deg, #0b1220, #0d2e57)"></textarea>
						</label>
						<label class="field">
							<span><?php esc_html_e('Custom image URL', 'git-blocks'); ?></span>
							<input type="url" data-bg-image placeholder="https://…/wallpaper.jpg" />
						</label>
						<div class="row-actions">
							<button type="button" data-bg-apply><?php esc_html_e('Apply look', 'git-blocks'); ?></button>
							<button type="button" class="ghost" data-bg-random><?php esc_html_e('Random gradient', 'git-blocks'); ?></button>
						</div>
					</section>

					<section class="customize-pane" data-pane="music" hidden>
						<p class="customize-hint"><?php esc_html_e('Free / open-source loops (mostly generated in-browser). Shuffle discovers a fresh random set.', 'git-blocks'); ?></p>
						<label class="field">
							<span><?php esc_html_e('Background music', 'git-blocks'); ?></span>
							<select data-music-track></select>
						</label>
						<p class="music-credit" data-music-credit></p>
						<label class="field">
							<span><?php esc_html_e('Custom audio URL (CC0 / CC-BY welcome)', 'git-blocks'); ?></span>
							<input type="url" data-music-custom placeholder="https://…/track.mp3" />
						</label>
						<label class="field inline">
							<span><?php esc_html_e('Music volume', 'git-blocks'); ?></span>
							<input type="range" data-music-volume min="0" max="100" value="35" />
						</label>
						<div class="row-actions wrap">
							<button type="button" data-music-discover><?php esc_html_e('Find free tracks', 'git-blocks'); ?></button>
							<button type="button" class="ghost" data-music-preview><?php esc_html_e('Preview', 'git-blocks'); ?></button>
							<button type="button" data-music-apply><?php esc_html_e('Play track', 'git-blocks'); ?></button>
							<button type="button" class="ghost" data-music-stop><?php esc_html_e('Stop', 'git-blocks'); ?></button>
						</div>
					</section>

					<section class="customize-pane" data-pane="share" hidden>
						<p class="customize-hint"><?php esc_html_e('Share the cabinet — optionally with your current look & music baked into the link.', 'git-blocks'); ?></p>
						<label class="field">
							<span><?php esc_html_e('Share link', 'git-blocks'); ?></span>
							<input type="text" readonly data-share-url value="<?php echo esc_attr($git_blocks_share_url); ?>" />
						</label>
						<label class="field checkbox">
							<input type="checkbox" data-share-include-prefs checked />
							<span><?php esc_html_e('Include look + music in the link', 'git-blocks'); ?></span>
						</label>
						<div class="row-actions wrap">
							<button type="button" data-share-copy><?php esc_html_e('Copy link', 'git-blocks'); ?></button>
							<button type="button" class="ghost" data-share-native><?php esc_html_e('System share', 'git-blocks'); ?></button>
							<a class="button-link ghost" data-share-x target="_blank" rel="noopener"><?php esc_html_e('Share on X', 'git-blocks'); ?></a>
							<a class="button-link ghost" data-share-linkedin target="_blank" rel="noopener"><?php esc_html_e('LinkedIn', 'git-blocks'); ?></a>
						</div>
						<p class="share-status" data-share-status aria-live="polite"></p>
					</section>

					<div class="customize-foot">
						<button type="button" data-customize-close><?php esc_html_e('Done', 'git-blocks'); ?></button>
					</div>
				</div>
			</div>
		</section>
		<div class="sr-only" data-live aria-live="polite"></div>
	</main>
</div>
