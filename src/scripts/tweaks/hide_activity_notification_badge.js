import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';

const activityButton = `button[aria-label="${translate('Activity')}"]`;
const mobileMenuButton = `button[aria-label="${translate('Menu')}"]`;

export const styleElement = buildStyle(`
:is(${activityButton}, ${mobileMenuButton}) ${keyToCss('notificationBadge')} {
  display: none;
}
`);
