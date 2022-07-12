import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`article ${keyToCss('followButton')} { display: none; }`);

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
