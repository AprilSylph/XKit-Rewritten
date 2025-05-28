import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
article footer ${keyToCss('controlIcon')} ${keyToCss('tooltip')},
article footer ${keyToCss('controlIcon')} ${keyToCss('tooltip')} ~ *,
article footer ${keyToCss('controls', 'engagementControls')} ${keyToCss('tooltip')} {
  display: none;
}
`);
