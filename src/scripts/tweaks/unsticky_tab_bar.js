import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

export const styleElement = buildStyle(`
  ${keyToCss('tabsHeader')} {
    position: relative !important;
    top: 0 !important;
    transition: none !important;
  }
`);
