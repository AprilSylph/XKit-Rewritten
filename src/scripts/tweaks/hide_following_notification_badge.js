import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';

const followingHomeButton = `:is(li[title="${translate('Home')}"], button[aria-label="${translate('Home')}"], a[href="/dashboard/following"])`;
const mobileMenuButton = `button[aria-label="${translate('Menu')}"]`;

const styleElement = buildStyle(`
:is(${followingHomeButton}, ${mobileMenuButton}) ${keyToCss('notificationBadge')} {
  display: none;
}
`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
