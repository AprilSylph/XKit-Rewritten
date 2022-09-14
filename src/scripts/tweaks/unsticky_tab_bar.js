import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
  ${keyToCss('tabsHeader')} { position: static !important; }
  ${keyToCss('post')} ${keyToCss('stickyContainer')} > ${keyToCss('avatar')} { top: 69px !important; }
`);

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
