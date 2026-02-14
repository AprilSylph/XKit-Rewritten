import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
article footer ${keyToCss('footerRow', 'footerContent', 'postOwnerControls')} :is(${keyToCss('tooltip')}, ${keyToCss('tooltip')} + ${keyToCss('arrow')}) {
  display: none;
}
`);
