import { buildStyle } from './interface.js';
import { keyToCss } from './css_map.js';

export const postPopoverClass = 'xkit-control-button-popover';

/**
 * Detects Chromium <130, Firefox <130, Safari <26, or another old or non-compliant browser. Note
 * that ideally this would also include Firefox 130-132 (which were not ESR).
 */
const oldBrowser = CSS.supports('text-wrap-style', 'balance') === false || typeof ImageDecoder === 'undefined';

/**
 * In older browsers (Chromium <129, Firefox <133, Safari <18.5), `container-type` creates a
 * stacking context, so the popup z-index does not apply outside of the footer. Applying z-index
 * layering to the footer causes the popup to float even when this stacking context is created.
 * @see https://github.com/w3c/csswg-drafts/issues/10544
 * @see https://github.com/AprilSylph/XKit-Rewritten/issues/1876
 */
const stackingContextFix = oldBrowser
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

    ${stackingContextFix}
  `)
);
