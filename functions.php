<?php

add_action('wp_enqueue_scripts', function () {

    wp_enqueue_style(

        'extendable-child-style',

        get_stylesheet_uri(),

        array(),

        filemtime(get_stylesheet_directory() . '/style.css')

    );

});

// Test comment