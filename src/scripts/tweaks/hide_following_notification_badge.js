import { keyToCss } from '../../util/css_map.js';
import { dom } from '../../util/dom.js';
import { buildStyle } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';
import { pageModifications } from '../../util/mutations.js';

const followingHomeButton = `:is(li[title="${translate('Home')}"], button[aria-label="${translate('Home')}"], a[href="/dashboard/following"])`;

const customTitleElement = dom('title', { 'data-xkit': true });
const styleElement = buildStyle(`
${followingHomeButton} ${keyToCss('notificationBadge')} {
  display: none;
}
`);

const onTitleChanged = ([titleElement]) => {
  const rawTitle = titleElement.textContent;
  const newTitle = rawTitle.replace(/^\(\d{1,2}\) /, '');
  customTitleElement.textContent = newTitle;
};

export const main = async () => {
  pageModifications.register('head title:not([data-xkit])', onTitleChanged);
  document.head.prepend(customTitleElement);
  document.documentElement.append(styleElement);
};

export const clean = async () => {
  customTitleElement.remove();
  styleElement.remove();
};
