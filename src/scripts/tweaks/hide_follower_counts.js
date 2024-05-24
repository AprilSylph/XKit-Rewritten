import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

export const styleElement = buildStyle(`
a[href$="/followers"] ${keyToCss('count')} {
  visibility: hidden;
}
a[href$="/activity/total"] {
  display: none;
}`);
