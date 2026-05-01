(function () {
    'use strict';

    /* Timestamp of last menu close — used to kill tap-through synthetic clicks */
    var lastClosed = 0;

    /* ── Header height → CSS var, keeps overlay top + close tap-target aligned ── */
    function syncLayout() {
        var header = document.querySelector('.site-sticky-header');
        if (header) {
            document.documentElement.style.setProperty(
                '--sl-header-h', header.getBoundingClientRect().height + 'px'
            );
        }
    }

    /* ── Portal backdrop on <body> so backdrop-filter escapes the sticky
       header stacking context and actually blurs page content behind it. ── */
    function createBackdrop() {
        if (document.getElementById('sl-nav-backdrop')) return;
        var bd = document.createElement('div');
        bd.id = 'sl-nav-backdrop';
        document.body.appendChild(bd);
    }

    function removeBackdrop() {
        var bd = document.getElementById('sl-nav-backdrop');
        if (bd) bd.parentNode.removeChild(bd);
    }

    function closeMenu(container) {
        var btn = container.querySelector(
            '.wp-block-navigation__responsive-container-close'
        );
        if (btn) btn.click();
    }

    /* ── Stagger items in when menu opens ── */
    function onOpen(container) {
        createBackdrop();
        container.querySelectorAll('.wp-block-navigation-item').forEach(function (item, i) {
            item.style.transitionDelay = (i * 0.055) + 's';
        });
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                container.classList.add('sl-nav-ready');
            });
        });
    }

    /* ── Reset on close, record timestamp for tap-through guard ── */
    function onClose(container) {
        lastClosed = Date.now();
        container.classList.remove('sl-nav-ready');
        container.querySelectorAll('.wp-block-navigation-item').forEach(function (item) {
            item.style.transitionDelay = '0s';
        });
        removeBackdrop();
    }

    /* ── Watch each nav container for open/close transitions ── */
    function watch(container) {
        new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                if (m.attributeName !== 'class') return;
                var wasOpen = m.oldValue
                    ? m.oldValue.split(' ').indexOf('is-menu-open') !== -1
                    : false;
                var isOpen = container.classList.contains('is-menu-open');
                if (isOpen && !wasOpen)      onOpen(container);
                else if (!isOpen && wasOpen) onClose(container);
            });
        }).observe(container, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });

        /* Tapping the overlay background (not a nav item) closes the menu.
           The overlay (z-index 9999) is above the backdrop (999), so the
           overlay is what actually receives these taps.                   */
        container.addEventListener('click', function (e) {
            if (!container.classList.contains('is-menu-open')) return;
            if (e.target.closest('.wp-block-navigation-item')) return;
            if (e.target.closest('.wp-block-navigation__responsive-container-close')) return;
            closeMenu(container);
        });
    }

    /* ── Overflow-based collapse: hamburger only when nav can't fit inline ── */
    function setupNavFitCheck() {
        var headerWrap = document.querySelector('.site-sticky-header .wp-block-group.alignwide');
        if (!headerWrap) return;

        function check() {
            var navEl = document.querySelector('.wp-block-navigation');
            if (!navEl) return;

            /* Don't recalculate while the overlay is open */
            var overlay = navEl.querySelector('.wp-block-navigation__responsive-container');
            if (overlay && overlay.classList.contains('is-menu-open')) return;

            /* Measure the inline nav items' intrinsic width using a detached clone.
               We can't rely on rightGroup.offsetWidth because when the hamburger is
               hidden (display:none), the nav items are also hidden by WP's CSS and
               the group measures as ~0. Instead we clone the inline __container,
               measure it off-screen at max-content width, then discard the clone. */
            var inlineItems = navEl.querySelector('.wp-block-navigation__container');
            var navItemsWidth = 0;

            if (inlineItems) {
                var clone = inlineItems.cloneNode(true);
                clone.style.cssText =
                    'position:fixed;top:-9999px;left:-9999px;' +
                    'display:flex!important;visibility:hidden;' +
                    'width:max-content;overflow:visible;pointer-events:none';
                document.body.appendChild(clone);
                navItemsWidth = clone.getBoundingClientRect().width;
                document.body.removeChild(clone);
            }

            var leftGroup   = headerWrap.children[0];
            var leftWidth   = leftGroup ? leftGroup.getBoundingClientRect().width : 0;
            var availWidth  = headerWrap.getBoundingClientRect().width;

            /* 32 px minimum breathing room between logo and nav */
            navEl.classList.toggle('sl-nav-collapsed', leftWidth + navItemsWidth + 32 > availWidth);
            syncLayout(); /* keep --sl-header-h accurate after any state change */
        }

        check(); /* initial pass */

        /* Use window resize (not ResizeObserver on headerWrap) to avoid the
           feedback loop where adding .sl-nav-collapsed changes the header size
           which fires the observer again and oscillates. */
        window.addEventListener('resize', function () {
            requestAnimationFrame(check);
        }, { passive: true });
    }

    function init() {
        document.body.classList.add('sl-js-loaded');
        syncLayout();
        window.addEventListener('resize', syncLayout, { passive: true });
        setupNavFitCheck();

        /* ── HAMBURGER TOGGLE — document capture fires before ANY element handler,
           including WP's. Two cases handled:

           1. Menu is OPEN + hamburger clicked → close it.
              Works on desktop (real click) and mobile (real tap on hamburger).

           2. Menu was just closed + hamburger clicked within 350ms → kill it.
              Catches mobile synthetic "ghost" click that falls through after
              the menu closes and lands on the hamburger underneath.         ── */
        document.addEventListener('click', function (e) {
            var openBtn = e.target.closest('.wp-block-navigation__responsive-container-open');
            if (!openBtn) return;

            var nav = openBtn.closest('.wp-block-navigation');
            var container = nav && nav.querySelector('.wp-block-navigation__responsive-container');
            if (!container) return;

            if (container.classList.contains('is-menu-open')) {
                /* Close: stop WP's open handler, trigger WP's close handler */
                e.stopPropagation();
                e.stopImmediatePropagation();
                closeMenu(container);
            } else if (Date.now() - lastClosed < 350) {
                /* Ghost click guard: kill reopening after a just-closed menu */
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }, true /* capture */);

        document.querySelectorAll('.wp-block-navigation__responsive-container').forEach(watch);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
