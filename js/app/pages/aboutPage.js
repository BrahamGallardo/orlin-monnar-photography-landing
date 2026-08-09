/**
 * Alpine module for the About page.
 *
 * The page is static: it does not call the API. The module exists only to keep
 * the copy in content.js and the studio details in a single place.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('aboutPage', () => ({
        content: window.SITE_CONTENT.about,
        business: window.SITE_CONTENT.business
    }));
});
