import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

export const styleElement = buildStyle(`
article footer ${keyToCss('controlIcon')} ${keyToCss('tooltip')},
article footer ${keyToCss('controlIcon')} ${keyToCss('tooltip')} ~ * {
  display: none;
}
`);
