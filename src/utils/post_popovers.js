import { buildStyle } from './interface.js';
import { keyToCss } from './css_map.js';

export const postPopoverClass = 'xkit-control-button-popover';

document.documentElement.append(
  buildStyle(`
    .${postPopoverClass} {
      z-index: 97;
    }

    footer${keyToCss('postFooter')}:has(.${postPopoverClass}) {
      /**
       * Applies z-index layering even when a stacking context is created here in older browsers.
       *
       * @see https://github.com/w3c/csswg-drafts/issues/10544
       * @see https://github.com/AprilSylph/XKit-Rewritten/issues/1876
       */
      position: relative;
      z-index: 97;
    }
  `)
);
