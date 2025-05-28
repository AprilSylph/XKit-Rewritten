import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
article footer :is(${keyToCss('tooltip')}, ${keyToCss('tooltip')} ~ *) {
  display: none;
}
`);
