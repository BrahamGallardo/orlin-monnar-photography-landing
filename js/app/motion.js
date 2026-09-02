/**
 * Reveal-on-scroll motion for the landing.
 *
 * A single IntersectionObserver is shared by every element marked with
 * data-omp-reveal: it adds the .omp-revealed class the first time the element
 * enters the viewport and stops watching it right away, so nothing animates
 * again on later scrolls.
 *
 * The hidden state lives in CSS behind the .omp-motion class that this file
 * puts on <html>. Without JavaScript, without IntersectionObserver, or when the
 * visitor asks for reduced motion, that class is never added and every element
 * is painted in its final state. Same idea as Alpine's [x-cloak], which is also
 * why this file is the only one of js/app/ loaded in the <head>: the class must
 * exist before the first paint or the content would blink.
 *
 * The template ships WOW.js and it stays: elements carrying the .wow class are
 * skipped here so a node is never animated by both engines.
 */
(function () {
    'use strict';

    /** Class added to <html> to enable the hidden state defined in CSS. */
    const ROOT_CLASS = 'omp-motion';

    /** Class the element receives once it has entered the viewport. */
    const VISIBLE_CLASS = 'omp-revealed';

    const REVEAL_SELECTOR = '[data-omp-reveal]';
    const STAGGER_SELECTOR = '[data-omp-reveal-stagger]';
    const DELAY_ATTRIBUTE = 'data-omp-reveal-delay';
    const DELAY_PROPERTY = '--omp-reveal-delay';

    /** Step between two elements of the same group, in milliseconds. */
    const DEFAULT_STAGGER = 90;

    /** Past this position the delay stops growing: a long grid should not wait. */
    const MAX_STAGGER_STEPS = 6;

    const OBSERVER_OPTIONS = {
        threshold: 0.12,
        // The reveal starts just before the element reaches the fold.
        rootMargin: '0px 0px -8% 0px'
    };

    const prefersReducedMotion = !!(window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    const isEnabled = ('IntersectionObserver' in window) && !prefersReducedMotion;

    // Elements already handed to the observer: observe() may run again over a
    // container without registering the same node twice.
    const registered = new WeakSet();

    let observer = null;

    /**
     * Returns the shared observer, creating it on first use.
     * @returns {IntersectionObserver} The single observer of the page.
     */
    function getObserver() {
        if (!observer) {
            observer = new IntersectionObserver(onIntersect, OBSERVER_OPTIONS);
        }

        return observer;
    }

    /**
     * Reveals the entries that became visible and stops watching them.
     * @param {Array<IntersectionObserverEntry>} entries - Reported entries.
     * @returns {void}
     */
    function onIntersect(entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add(VISIBLE_CLASS);

            // First appearance only: nothing animates twice.
            getObserver().unobserve(entry.target);
        });
    }

    /**
     * Normalizes what the public methods accept into a list of roots.
     * @param {(string|Element|NodeList|Array<Element>)} [target] - Selector, node or list.
     * @returns {Array<(Document|Element)>} Roots to inspect.
     */
    function toRoots(target) {
        if (!target) {
            return [document];
        }

        if (typeof target === 'string') {
            return Array.prototype.slice.call(document.querySelectorAll(target));
        }

        if (target.nodeType) {
            return [target];
        }

        return Array.prototype.slice.call(target);
    }

    /**
     * Collects the marked elements under a root, the root itself included.
     * @param {(Document|Element)} root - Subtree to inspect.
     * @returns {Array<Element>} Marked elements, in document order.
     */
    function collect(root) {
        const found = Array.prototype.slice.call(root.querySelectorAll(REVEAL_SELECTOR));

        if (root.nodeType === 1 && root.matches(REVEAL_SELECTOR)) {
            found.unshift(root);
        }

        return found;
    }

    /**
     * Writes the delay of one element as a CSS variable.
     * @param {Element} element - Marked element.
     * @returns {void}
     * @remarks
     * An explicit delay always wins. Otherwise the element takes its position
     * inside the closest staggered container, which is what turns a gallery or
     * a list into a cascade instead of a single block.
     */
    function applyDelay(element) {
        const own = element.getAttribute(DELAY_ATTRIBUTE);

        if (own !== null) {
            element.style.setProperty(DELAY_PROPERTY, (parseInt(own, 10) || 0) + 'ms');

            return;
        }

        const group = element.closest(STAGGER_SELECTOR);

        if (!group) {
            return;
        }

        const step = parseInt(group.getAttribute('data-omp-reveal-stagger'), 10) || DEFAULT_STAGGER;
        const siblings = group.querySelectorAll(REVEAL_SELECTOR);
        const index = Array.prototype.indexOf.call(siblings, element);
        const position = Math.min(index < 0 ? 0 : index, MAX_STAGGER_STEPS);

        element.style.setProperty(DELAY_PROPERTY, (position * step) + 'ms');
    }

    /**
     * Hands one element to the shared observer.
     * @param {Element} element - Marked element.
     * @returns {void}
     */
    function register(element) {
        // WOW.js owns its own nodes: animating them here too would fight it.
        if (registered.has(element) || element.classList.contains('wow')) {
            return;
        }

        registered.add(element);
        applyDelay(element);
        getObserver().observe(element);
    }

    window.ompMotion = {
        /**
         * Registers every marked element found under the given roots.
         * @param {(string|Element|NodeList|Array<Element>)} [target] - Defaults to the whole document.
         * @returns {void}
         * @remarks
         * Safe to call again once Alpine has inserted new nodes, from inside a
         * $nextTick: elements already registered are skipped.
         */
        observe: function (target) {
            if (!isEnabled) {
                return;
            }

            toRoots(target).forEach(function (root) {
                collect(root).forEach(register);
            });
        },

        /**
         * Puts elements in their final state without waiting for the viewport.
         * @param {(string|Element|NodeList|Array<Element>)} [target] - Defaults to the whole document.
         * @returns {void}
         * @remarks
         * Escape hatch for content that must be readable no matter what, such
         * as an error state rendered outside the visible area.
         */
        reveal: function (target) {
            toRoots(target).forEach(function (root) {
                collect(root).forEach(function (element) {
                    element.classList.add(VISIBLE_CLASS);
                });
            });
        },

        /**
         * Reports whether anything will be animated at all.
         * @returns {boolean} True when every element stays in its final state.
         */
        isDisabled: function () {
            return !isEnabled;
        }
    };

    if (!isEnabled) {
        return;
    }

    // Before the first paint: the marked content is born hidden instead of
    // being painted and then hidden.
    document.documentElement.classList.add(ROOT_CLASS);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            window.ompMotion.observe();
        });
    } else {
        window.ompMotion.observe();
    }
})();