import { tooltipClass } from '../../util/control_buttons.js';
import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
article footer ${keyToCss('controlIcon')} ${keyToCss('tooltip')},
article footer ${keyToCss('controlIcon')} ${keyToCss('tooltip')} ~ *,
.${tooltipClass} {
  display: none;
}
`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
