<?php
/**
 * Git Blocks plugin bootstrap.
 *
 * @package GitBlocks
 */

declare(strict_types=1);

namespace GitBlocks;

if (! defined('ABSPATH')) {
	exit;
}

/**
 * Main plugin class.
 */
final class Plugin {
	/** @var self|null */
	private static $instance = null;

	/** @var bool */
	private $should_enqueue = false;

	/**
	 * Singleton accessor.
	 */
	public static function instance(): self {
		if (null === self::$instance) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hook WordPress.
	 */
	public function init(): void {
		add_shortcode('git_blocks', array( $this, 'render_shortcode' ));
		add_action('wp_enqueue_scripts', array( $this, 'register_assets' ));
		add_filter('body_class', array( $this, 'body_class' ));
	}

	/**
	 * Register scripts/styles (loaded only when shortcode renders).
	 */
	public function register_assets(): void {
		wp_register_style(
			'git-blocks-fonts',
			'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Inter:wght@700;800&display=swap',
			array(),
			null
		);

		wp_register_style(
			'git-blocks',
			GIT_BLOCKS_URL . 'assets/css/git-blocks.css',
			array( 'git-blocks-fonts' ),
			GIT_BLOCKS_VERSION
		);

		wp_register_script(
			'git-blocks',
			GIT_BLOCKS_URL . 'assets/js/git-blocks.js',
			array(),
			GIT_BLOCKS_VERSION,
			true
		);
	}

	/**
	 * Shortcode: [git_blocks] or [git_blocks layout="viewport" share_url="https://example.com/play/"]
	 *
	 * @param array<string, string>|string $atts Shortcode attributes.
	 */
	public function render_shortcode($atts = array()): string {
		$atts = shortcode_atts(
			array(
				'layout'    => 'viewport', // viewport | card
				'share_url' => '',
				'autostart' => 'true',
			),
			is_array($atts) ? $atts : array(),
			'git_blocks'
		);

		$this->should_enqueue = true;
		wp_enqueue_style('git-blocks');
		wp_enqueue_script('git-blocks');

		$share_url = $atts['share_url'] !== ''
			? esc_url($atts['share_url'])
			: esc_url(get_permalink() ?: home_url('/'));

		wp_add_inline_script(
			'git-blocks',
			'window.GitBlocksConfig = Object.assign({}, window.GitBlocksConfig || {}, ' . wp_json_encode(
				array(
					'shareUrl'  => $share_url,
					'autoStart' => filter_var($atts['autostart'], FILTER_VALIDATE_BOOLEAN),
					'layout'    => sanitize_key($atts['layout']),
				)
			) . ');',
			'before'
		);

		$layout_class = 'git-blocks-embed layout-' . sanitize_html_class($atts['layout']);

		ob_start();
		$git_blocks_layout_class = $layout_class;
		$git_blocks_share_url    = $share_url;
		include GIT_BLOCKS_PATH . 'templates/player.php';
		return (string) ob_get_clean();
	}

	/**
	 * Add a body class when the shortcode ran on this request.
	 *
	 * @param string[] $classes Body classes.
	 * @return string[]
	 */
	public function body_class(array $classes): array {
		if ($this->should_enqueue) {
			$classes[] = 'has-git-blocks';
		}
		return $classes;
	}
}
