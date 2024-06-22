import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
a[href$="/followers"] ${keyToCss('count')} {
  visibility: hidden;
}
a[href$="/activity/total"] {
  display: none;
}`);
