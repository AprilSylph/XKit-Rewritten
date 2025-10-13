import { keyToCss } from './css_map.js';
import { postSelector } from './interface.js';

/**
 * Detects Chromium <130, Firefox <140, Safari <26, or another old or non-compliant browser.
 */
const oldBrowser =
  CSS.supports('text-wrap-style', 'balance') === false ||
  typeof CookieStore === 'undefined' ||
  typeof ImageDecoder === 'undefined';

/**
 * In older browsers (Chromium <129, Firefox <133, Safari <18.4), `container-type` creates a
 * stacking context, so the popup z-index does not apply outside of the footer.
 *
 * Removing the container fixes this, but causes a minor regression: disabling Tumblr's
 * breakpoint-specific styling (smaller text in footer buttons in masonry view in peepr).
 * @see https://github.com/w3c/csswg-drafts/issues/10544
 * @see https://github.com/AprilSylph/XKit-Rewritten/issues/1876
 */
export const popoverStackingContextFix = oldBrowser
  ? `
    ${postSelector} footer${keyToCss('postFooter')} {
      container-type: unset;
    }
  `
  : '';
