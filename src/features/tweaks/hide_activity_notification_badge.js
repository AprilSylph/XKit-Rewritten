import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';

const activityButton = ':is(button, li):has(use[href="#managed-icon__lightning"])';
const mobileMenuButton = `button[aria-label="${translate('Menu')}"]`;

export const styleElement = buildStyle(`
:is(${activityButton}, ${mobileMenuButton}) ${keyToCss('notificationBadge')} {
  display: none;
}
`);
