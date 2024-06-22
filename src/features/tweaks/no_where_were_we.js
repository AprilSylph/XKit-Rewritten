import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const styleElement = buildStyle(`${keyToCss('wrapper')} ${keyToCss('newPostIndicator')} { display: none; }`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
