import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
${keyToCss('activity')} ${keyToCss('followingBadgeContainer', 'mutualsBadgeContainer')} {
  display: none;
}
`);
