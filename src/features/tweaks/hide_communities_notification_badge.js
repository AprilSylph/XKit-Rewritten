import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { mobileMenuBadgeHide } from '../../utils/mobile_menu_badge_hide.js';

const communitiesButton = `button[aria-label="${translate('Communities')}"]`;

export const styleElement = buildStyle(`
${communitiesButton} ${keyToCss('notificationBadge')} {
  display: none;
}
`);

export const main = async function () {
  mobileMenuBadgeHide.register('communities');
};

export const clean = async function () {
  mobileMenuBadgeHide.unregister('communities');
};
