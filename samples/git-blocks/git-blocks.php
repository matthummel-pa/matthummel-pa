<?php
/**
 * Plugin Name:       Git Blocks
 * Plugin URI:        https://matthummel.com/git-blocks/
 * Description:       Embeddable tetris-style Git Blocks cabinet — shortcode sample for portfolios and demos.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Matt Hummel
 * Author URI:        https://matthummel.com
 * License:           MIT
 * License URI:       https://opensource.org/licenses/MIT
 * Text Domain:       git-blocks
 *
 * @package GitBlocks
 */

declare(strict_types=1);

if (! defined('ABSPATH')) {
	exit;
}

define('GIT_BLOCKS_VERSION', '1.0.0');
define('GIT_BLOCKS_FILE', __FILE__);
define('GIT_BLOCKS_PATH', plugin_dir_path(__FILE__));
define('GIT_BLOCKS_URL', plugin_dir_url(__FILE__));

require_once GIT_BLOCKS_PATH . 'includes/class-git-blocks-plugin.php';

\GitBlocks\Plugin::instance()->init();
