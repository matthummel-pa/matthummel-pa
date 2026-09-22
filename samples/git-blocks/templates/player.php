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
	<div class="dev-clouds pattern-drift" data-dev-clouds aria-hidden="true"></div>
	<main class="page">
		<p class="page-kicker"><?php esc_html_e('Mini player · Git Blocks', 'git-blocks'); ?></p>
		<h1><?php esc_html_e('Git Blocks', 'git-blocks'); ?></h1>
		<p class="page-lead"><?php esc_html_e('Not Tetris — squash 4+ matching commits, deploy full rows, cascade the pipeline.', 'git-blocks'); ?></p>

		<section class="player" data-git-blocks aria-label="<?php esc_attr_e('Git Blocks game player', 'git-blocks'); ?>">
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
					<canvas data-board width="240" height="480" tabindex="0" role="application" aria-label="<?php esc_attr_e('Git Blocks board. Scroll moves, right-click rotates, drag sideways.', 'git-blocks'); ?>"></canvas>
					<div class="overlay is-clickable" data-overlay>
						<div>
							<p class="overlay-level" data-overlay-level hidden><?php esc_html_e('Level 1', 'git-blocks'); ?></p>
							<h2 data-overlay-title><?php esc_html_e('Git Blocks', 'git-blocks'); ?></h2>
							<p data-overlay-body><?php esc_html_e('Stack commits. Clear lines. Don\'t let the backlog reach production.', 'git-blocks'); ?></p>
							<button type="button" data-play><?php esc_html_e('Play', 'git-blocks'); ?></button>
						</div>
					</div>
				</div>
				<aside class="side">
					<div class="stats-row">
						<div class="stat"><span><?php esc_html_e('Score', 'git-blocks'); ?></span><strong data-score>0</strong></div>
						<div class="stat"><span><?php esc_html_e('Shipped', 'git-blocks'); ?></span><strong data-lines>0</strong></div>
						<div class="stat"><span><?php esc_html_e('Sprint', 'git-blocks'); ?></span><strong data-level>1</strong></div>
						<div class="stat"><span><?php esc_html_e('Best', 'git-blocks'); ?></span><strong data-high>0</strong></div>
					</div>
					<div class="stats-row compact">
						<div class="stat"><span><?php esc_html_e('Combo', 'git-blocks'); ?></span><strong data-combo>0</strong></div>
						<div class="stat"><span><?php esc_html_e('Deploys', 'git-blocks'); ?></span><strong data-deploys>0</strong></div>
						<div class="stat"><span><?php esc_html_e('Squashes', 'git-blocks'); ?></span><strong data-squashes>0</strong></div>
					</div>
					<p class="sprint-name" data-sprint>v0.1 scaffold</p>
					<div class="trays">
						<div class="tray"><span><?php esc_html_e('Stash', 'git-blocks'); ?></span><div data-hold></div></div>
						<div class="tray"><span><?php esc_html_e('Queue', 'git-blocks'); ?></span><div data-next></div></div>
					</div>
					<p class="message" data-message><?php esc_html_e('Sprint ready — match 4+ or fill a row.', 'git-blocks'); ?></p>
					<div class="power-row">
						<button type="button" class="ghost" data-git-clean><?php esc_html_e('git clean (1)', 'git-blocks'); ?></button>
						<button type="button" class="ghost" data-force-push><?php esc_html_e('force-push (1)', 'git-blocks'); ?></button>
					</div>
					<ul class="commit-log" data-commit-log aria-label="<?php esc_attr_e('Commit log', 'git-blocks'); ?>"></ul>
					<div class="badge-row" data-badges aria-label="<?php esc_attr_e('Achievements', 'git-blocks'); ?>"></div>
					<p class="concept-note"><?php esc_html_e('Match 4+ same commits to squash. Fill a full row to deploy. Cascades chain for pipeline combos.', 'git-blocks'); ?></p>
					<div class="player-dock">
						<span class="controls-label"><?php esc_html_e('Controls', 'git-blocks'); ?></span>
						<div class="pad" role="group" aria-label="<?php esc_attr_e('Game controls', 'git-blocks'); ?>">
							<button type="button" data-move="left" aria-label="<?php esc_attr_e('Move left', 'git-blocks'); ?>"><?php esc_html_e('Left', 'git-blocks'); ?></button>
							<button type="button" data-move="rotate" aria-label="<?php esc_attr_e('Rotate clockwise', 'git-blocks'); ?>"><?php esc_html_e('Rotate', 'git-blocks'); ?></button>
							<button type="button" data-move="right" aria-label="<?php esc_attr_e('Move right', 'git-blocks'); ?>"><?php esc_html_e('Right', 'git-blocks'); ?></button>
							<button type="button" data-move="down" aria-label="<?php esc_attr_e('Soft drop', 'git-blocks'); ?>"><?php esc_html_e('Down', 'git-blocks'); ?></button>
							<button type="button" class="ghost" data-move="hold"><?php esc_html_e('Hold', 'git-blocks'); ?></button>
							<button type="button" data-move="rotate-ccw" aria-label="<?php esc_attr_e('Rotate counter-clockwise', 'git-blocks'); ?>">↺</button>
							<button type="button" data-move="drop"><?php esc_html_e('Hard drop', 'git-blocks'); ?></button>
						</div>
						<p class="keys" data-keys-help><?php esc_html_e('Scroll moves · right-click rotates · drag sideways · Customize to remap', 'git-blocks'); ?></p>
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
						<button type="button" data-tab="controls" role="tab" aria-selected="false"><?php esc_html_e('Controls', 'git-blocks'); ?></button>
						<button type="button" data-tab="share" role="tab" aria-selected="false"><?php esc_html_e('Share', 'git-blocks'); ?></button>
					</div>

					<section class="customize-pane is-active" data-pane="look">
						<p class="customize-hint"><?php esc_html_e('Pick a CSS backdrop, paste a gradient, or load a custom image URL.', 'git-blocks'); ?></p>
						<div class="bg-presets" data-bg-presets></div>
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
						<p class="customize-hint"><?php esc_html_e('Preview game SFX', 'git-blocks'); ?></p>
						<div class="row-actions wrap sfx-row">
							<button type="button" class="ghost" data-sfx-preview="move"><?php esc_html_e('Move', 'git-blocks'); ?></button>
							<button type="button" class="ghost" data-sfx-preview="rotate"><?php esc_html_e('Rotate', 'git-blocks'); ?></button>
							<button type="button" class="ghost" data-sfx-preview="drop"><?php esc_html_e('Drop', 'git-blocks'); ?></button>
							<button type="button" class="ghost" data-sfx-preview="clear"><?php esc_html_e('Clear', 'git-blocks'); ?></button>
							<button type="button" class="ghost" data-sfx-preview="start"><?php esc_html_e('Start', 'git-blocks'); ?></button>
						</div>
					</section>

					<section class="customize-pane" data-pane="controls" hidden>
						<p class="customize-hint"><?php esc_html_e('Click a key chip, then press a new key. Mouse menus remap board gestures.', 'git-blocks'); ?></p>
						<div class="bindings-grid" data-key-bindings></div>
						<div class="bindings-grid mouse" data-mouse-bindings></div>
						<div class="row-actions">
							<button type="button" class="ghost" data-bindings-reset><?php esc_html_e('Reset controls', 'git-blocks'); ?></button>
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
