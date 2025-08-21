import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
${keyToCss('wrapper')} ${keyToCss('newPostIndicator')} { display: none; }
`);
