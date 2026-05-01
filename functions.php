<?php

/**
 * Severino Labs — theme setup
 */

/* ── Theme support ── */
add_action( 'after_setup_theme', function () {
	add_theme_support( 'wp-block-styles' );
	add_editor_style( 'style.css' );
} );

/* ── Enqueue theme stylesheet + mobile nav script ── */
add_action( 'wp_enqueue_scripts', function () {
	$theme_dir = get_stylesheet_directory();

	wp_enqueue_style(
		'severino-labs-style',
		get_stylesheet_uri(),
		[],
		filemtime( $theme_dir . '/style.css' )
	);

	$nav_js = $theme_dir . '/assets/js/mobile-nav.js';
	wp_enqueue_script(
		'severino-labs-mobile-nav',
		get_stylesheet_directory_uri() . '/assets/js/mobile-nav.js',
		[],
		file_exists( $nav_js ) ? filemtime( $nav_js ) : '1.0',
		true
	);
} );

/* ── Mark active nav item for custom links / archives ── */
add_action( 'wp_footer', function () {
	?>
	<script>
	(function () {
		var current = window.location.pathname;
		document.querySelectorAll('.wp-block-navigation a').forEach(function (a) {
			try {
				if (new URL(a.href).pathname === current) {
					a.closest('.wp-block-navigation-item')
					 .classList.add('current-menu-item');
				}
			} catch (e) {}
		});
	})();
	</script>
	<?php
} );
