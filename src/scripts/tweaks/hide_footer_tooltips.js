import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
article footer ${keyToCss('controlIcon')} ${keyToCss('tooltip')},
article footer ${keyToCss('controlIcon')} ${keyToCss('tooltip')} ~ *,
.xkit-control-button-tooltip {
  display: none;
}
`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
