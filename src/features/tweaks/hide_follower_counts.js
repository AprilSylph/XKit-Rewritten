import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const styleElement = buildStyle(`
a[href$="/followers"] ${keyToCss('count')} {
  visibility: hidden;
}
a[href$="/activity/total"] {
  display: none;
}`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
