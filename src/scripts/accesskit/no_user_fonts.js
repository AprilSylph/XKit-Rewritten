import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

export const styleElement = buildStyle(`
${keyToCss('textBlock')} ${keyToCss('quote', 'chat', 'quirky')} {
  font-family: var(--font-family);
}
`);
