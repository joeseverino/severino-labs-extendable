(function () {
    'use strict';

    var data = window.SeverinoNavData || {};

    /* ── Brand: logo + site title injected into the overlay dialog ── */
    function buildBrand(dialog) {
        if (dialog.querySelector('.sl-nav-brand')) return;

        var logoUrl  = data.logoUrl   || '';
        var siteName = data.siteTitle || '';
        if (!logoUrl && !siteName) return;

        var brand = document.createElement('div');
        brand.className = 'sl-nav-brand';

        var inner = '';
        if (logoUrl)  inner += '<img src="' + logoUrl + '" alt="" aria-hidden="true" />';
        if (siteName) inner += '<span class="sl-nav-title">' + siteName + '</span>';
        brand.innerHTML = inner;

        dialog.prepend(brand);
    }

    /* ── Stagger nav items in on open ── */
    function stagger(container) {
        var items = container.querySelectorAll('.wp-block-navigation-item');
        items.forEach(function (item, i) {
            item.style.transitionDelay = (i * 0.055) + 's';
        });
        // Double rAF so CSS paints opacity:0 before we trigger the transition
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                container.classList.add('sl-nav-ready');
            });
        });
    }

    /* ── Reset on close so re-open animates fresh ── */
    function reset(container) {
        container.classList.remove('sl-nav-ready');
        container.querySelectorAll('.wp-block-navigation-item').forEach(function (item) {
            item.style.transitionDelay = '0s';
        });
    }

    /* ── Watch each nav container for WP toggling is-menu-open ── */
    function watch(container) {
        new MutationObserver(function (mutations) {
            mutations.forEach(function (m) {
                if (m.attributeName !== 'class') return;
                if (container.classList.contains('is-menu-open')) {
                    var dialog = container.querySelector('.wp-block-navigation__responsive-dialog');
                    if (dialog) buildBrand(dialog);
                    stagger(container);
                } else {
                    reset(container);
                }
            });
        }).observe(container, { attributes: true });
    }

    function init() {
        document.querySelectorAll('.wp-block-navigation__responsive-container').forEach(watch);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
