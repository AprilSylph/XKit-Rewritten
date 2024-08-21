import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';

const communitiesButton = `button[aria-label="${translate('Communities')}"]`;
const mobileMenuButton = `button[aria-label="${translate('Menu')}"]`;

export const styleElement = buildStyle(`
:is(${communitiesButton}, ${mobileMenuButton}) ${keyToCss('notificationBadge')} {
  display: none;
}
`);