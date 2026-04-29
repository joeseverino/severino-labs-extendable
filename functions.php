<?php

add_action('wp_enqueue_scripts', function () {

    wp_enqueue_style(

        'extendable-child-style',

        get_stylesheet_uri(),

        array(),

        filemtime(get_stylesheet_directory() . '/style.css')

    );

});

/**
 * Mark the active nav item when WordPress doesn't detect it automatically
 * (e.g. custom links pointing to archives or custom post types).
 */
add_action('wp_footer', function () {
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
});