import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
  ${keyToCss('tabsHeader')} { position: static; }
  ${keyToCss('post')} ${keyToCss('stickyContainer')} > ${keyToCss('avatar')} { top: 69px; }
`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
