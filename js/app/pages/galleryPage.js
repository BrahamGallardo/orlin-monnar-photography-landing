/**
 * Alpine module for the album index.
 *
 * Reads GET /api/gallery/categories, which already carries coverPhoto and
 * photoCount: one request paints the whole mosaic. Requesting each category to
 * derive its cover would burn the 60 req/min rate limit for nothing.
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('galleryPage', () => ({
        loading: true,
        categories: [],
        notice: '',

        // While the fallback is in use the cards are not navigable: the detail
        // page has no fallback, so every link would land on "album not found".
        usingPlaceholders: false,

        content: window.SITE_CONTENT.gallery,
        states: window.SITE_CONTENT.states,

        /**
         * Loads the published categories.
         * @returns {Promise<void>}
         */
        async init() {
            const service = new GalleryService(createApiService());
            const response = await service.getCategories();

            if (response.success) {
                this.categories = response.data || [];
            } else {
                this.applyFailure(response);
            }

            this.loading = false;

            this.$nextTick(() => {
                this.layout();
            });
        },

        /**
         * Reports a failed request and decides whether the fallback applies.
         * @param {Object} response - Normalized API response.
         * @returns {void}
         * @remarks
         * status 0 is the only case where nothing came back at all —network
         * down or timeout— and that is what the provisional albums are for.
         * Anything the API did answer, an empty list included, is real
         * information about the gallery: it is shown as it is instead of being
         * dressed up with photographs the studio never published.
         */
        applyFailure(response) {
            console.error(
                `[gallery] Categories could not be loaded (status ${response.status}): ${response.error}`
            );

            if (response.status !== 0) {
                this.notice = response.error;

                return;
            }

            this.categories = window.PLACEHOLDER_CATEGORIES;
            this.usingPlaceholders = true;
        },

        /**
         * Lays the mosaic out and hands the new cards to the reveal observer.
         * @returns {void}
         * @remarks
         * The whole set of cards is written at once, so Isotope is reset and
         * not reloaded. Registering the reveal here and not in CSS is what
         * makes the cards appear in cascade instead of as a single block.
         */
        layout() {
            pluginBridge.resetIsotope('#gallery-grid');
            window.ompMotion.observe('#gallery-grid');
        },

        /**
         * Link to the album detail, or null while the fallback is in use.
         * @param {Object} category - GalleryCategoryDto.
         * @returns {string|null} URL, or null to render the card without a link.
         */
        albumHref(category) {
            return this.usingPlaceholders
                ? null
                : `gallery-detail.html?c=${encodeURIComponent(category.slug)}`;
        },

        /**
         * Photograph count of an album, in words.
         * @param {Object} category - GalleryCategoryDto.
         * @returns {string} Label shown under the album name.
         */
        photoCountLabel(category) {
            const count = category.photoCount || 0;
            const noun = count === 1 ? this.content.photoCountOne : this.content.photoCountMany;

            return `${count} ${noun}`;
        },

        /**
         * Inline style that reserves the real box of a cover.
         * @param {Object} photo - PhotoDto, or null when the album has no cover.
         * @returns {string} Inline style with the aspect ratio of the frame.
         */
        frameStyle(photo) {
            return `aspect-ratio: ${photoAspectRatio(photo)}`;
        },

        /**
         * URL of the thumb derivative.
         * @param {Object} photo - PhotoDto.
         * @returns {string} Derivative URL.
         */
        thumb(photo) {
            return resolveMediaUrl(photo.thumbUrl);
        },

        /**
         * Srcset of a cover: thumb and medium, never the 2560 px derivative.
         * @param {Object} photo - PhotoDto.
         * @returns {string} srcset attribute value.
         */
        srcset(photo) {
            return buildGridSrcset(photo);
        },

        /**
         * Alternative text of the cover.
         * @param {Object} photo - PhotoDto.
         * @returns {string} Alternative text.
         */
        alt(photo) {
            return photoAltText(photo);
        }
    }));
});
