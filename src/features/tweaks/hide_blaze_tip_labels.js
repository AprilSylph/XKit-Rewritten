import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const styleElement = buildStyle(`
article ${keyToCss('igniteButton', 'tippingButton')} > svg:not([style*="#ff8a00"]) ~ ${keyToCss('label')} {
  display: none;
}
`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
