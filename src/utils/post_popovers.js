import { buildStyle } from './interface.js';
import { keyToCss } from './css_map.js';

export const postPopoverClass = 'xkit-control-button-popover';

/**
 * Detects Chromium <130, Firefox <130, Safari <26, or another old or non-compliant browser.
 *
 * This is missing Firefox 130-133 (which were not ESR) compared to the ideal set.
 */
const oldBrowser = !CSS.supports('text-wrap-style', 'balance') || typeof ImageDecoder !== 'function';

/**
 * In older browsers (Chromium 105-129, Firefox 110-133, Safari 16-18.5), `container-type` creates a
 * stacking context, so the popup z-index does not apply outside of the footer. Applying z-index
 * layering to the footer causes the popup to float even when this stacking context is created.
 * @see https://github.com/w3c/csswg-drafts/issues/10544
 * @see https://github.com/AprilSylph/XKit-Rewritten/issues/1876
 */
const containerQueryFix = oldBrowser
  ? `
    footer${keyToCss('postFooter')}:has(.${postPopoverClass}) {
      position: relative;
      z-index: 97;
    }
  `
  : '';

document.documentElement.append(
  buildStyle(`
    .${postPopoverClass} {
      z-index: 97;
    }

    ${containerQueryFix}
  `)
);
