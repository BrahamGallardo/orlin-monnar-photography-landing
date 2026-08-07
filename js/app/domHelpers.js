/**
 * DOM utilities for the markup that is built by hand.
 *
 * Some jQuery plugins of the template take ownership of their nodes (Owl
 * Carousel clones them), so that content cannot be rendered by Alpine and is
 * assembled as plain HTML instead. Anything interpolated there must be escaped.
 */

/**
 * Escapes a value so it can be safely inserted as HTML.
 * @param {string} value - Source text.
 * @returns {string} Text safe for innerHTML.
 */
function escapeHtml(value) {
    const element = document.createElement('div');

    element.textContent = value === null || value === undefined ? '' : String(value);

    return element.innerHTML;
}

// Exported globally.
window.escapeHtml = escapeHtml;
