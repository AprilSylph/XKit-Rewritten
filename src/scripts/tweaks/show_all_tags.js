import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

export const styleElement = buildStyle(`
${keyToCss('tags')}${keyToCss('collapsed')} {
  max-height: none !important;
}
${keyToCss('seeAll')} {
  display: none;
}
`);
