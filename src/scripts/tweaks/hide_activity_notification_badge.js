import { keyToClasses } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { translate } from '../util/language_data.js';

const badgeSelector = keyToClasses('notificationBadge').map(cssClass => `button[aria-label="${translate('Activity')}"] .${cssClass}`).join(',');
const styleElement = buildStyle(`${badgeSelector} { display: none; }`);

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
