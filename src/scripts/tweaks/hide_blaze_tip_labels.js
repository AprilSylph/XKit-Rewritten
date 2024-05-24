import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

export const styleElement = buildStyle(`
article ${keyToCss('igniteButton', 'tippingButton')} > svg:not([style*="#ff8a00"]) ~ ${keyToCss('label')} {
  display: none;
}
`);
