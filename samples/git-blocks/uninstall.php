<?php
/**
 * Cleanup on uninstall.
 *
 * @package GitBlocks
 */

declare(strict_types=1);

if (! defined('WP_UNINSTALL_PLUGIN')) {
	exit;
}

// No options stored server-side; player prefs live in the browser.
