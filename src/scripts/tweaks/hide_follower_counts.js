import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
a[href$="/followers"] ${keyToCss('count')} {
  visibility: hidden;
}
a[href$="/activity/total"] {
  display: none;
}`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
