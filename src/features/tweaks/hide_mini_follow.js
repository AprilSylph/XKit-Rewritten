import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
article ${keyToCss('followButton')}:not(${keyToCss('postMeatballsContainer')} *) { display: none; }
`);
