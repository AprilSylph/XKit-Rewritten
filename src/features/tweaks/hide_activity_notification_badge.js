import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';
import { mobileMenuBadgeHide } from '../../utils/mobile_menu_badge_hide.js';

const activityButton = ':is(button, li):has(use[href="#managed-icon__lightning"])';

export const styleElement = buildStyle(`
${activityButton} ${keyToCss('notificationBadge')} {
  display: none;
}
`);

export const main = async function () {
  mobileMenuBadgeHide.register('activity');
};

export const clean = async function () {
  mobileMenuBadgeHide.unregister('activity');
};
