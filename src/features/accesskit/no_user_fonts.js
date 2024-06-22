import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
${keyToCss('textBlock')} ${keyToCss('quote', 'chat', 'quirky')} {
  font-family: var(--font-family);
}
`);
