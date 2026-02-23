import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
article ${keyToCss('textBlock')} a[target="_blank"] {
  color: rgba(var(--blue));
}
`);
