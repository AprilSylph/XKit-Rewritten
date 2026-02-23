import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
${keyToCss('tags')}${keyToCss('collapsed')} {
  max-height: none !important;
}
${keyToCss('seeAll', 'seeAllWrapper')} {
  display: none;
}
`);
