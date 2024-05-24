import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

export const styleElement = buildStyle(`
${keyToCss('wrapper')} ${keyToCss('newPostIndicator')} { display: none; }
`);
