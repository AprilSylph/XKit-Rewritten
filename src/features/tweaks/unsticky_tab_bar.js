import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const styleElement = buildStyle(`
  ${keyToCss('tabsHeader')} {
    position: relative !important;
    top: 0 !important;
    transition: none !important;
  }
`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
