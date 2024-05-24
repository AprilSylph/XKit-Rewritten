import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

export const styleElement = buildStyle(`
article ${keyToCss('textBlock')} a[target="_blank"] {
  color: rgba(var(--blue));
}
`);
