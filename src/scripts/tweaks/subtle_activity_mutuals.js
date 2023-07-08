import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
${keyToCss('activity')} ${keyToCss('generalLabelContainer')} {
  color: RGB(var(--black));
  background-color: RGBA(var(--black), 0.07);
}
`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
