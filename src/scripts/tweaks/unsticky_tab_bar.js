import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
  ${keyToCss('tabsHeader')} {
    position: relative !important;
    top: 0 !important;
    transition: none !important;
  }
  ${keyToCss('post')} ${keyToCss('stickyContainer')} > ${keyToCss('avatar')} {
    --dashboard-tabs-header-height: 0px !important;
  }
`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
