import { keyToCss } from '../../utils/css_map.js';
import { dom } from '../../utils/dom.js';
import { buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { pageModifications } from '../../utils/mutations.js';

const followingHomeButton = `:is(li[title="${translate('Home')}"], button[aria-label="${translate('Home')}"], a[href="/dashboard/following"], a[href="/dashboard"])`;
const mobileMenuButton = `button[aria-label="${translate('Menu')}"]`;

const customTitleElement = dom('title', { 'data-xkit': true });

export const styleElement = buildStyle(`
:is(${followingHomeButton}, ${mobileMenuButton}) ${keyToCss('notificationBadge')} {
  display: none;
}
`);

const onTitleChanged = () => {
  const titleElement = document.querySelector('head title:not([data-xkit])');

  const rawTitle = titleElement.textContent;
  const newTitle = rawTitle.replace(/^\(\d{1,2}\) /, '');
  customTitleElement.textContent = newTitle;

  clearAppBadge();
  observer.observe(titleElement, { characterData: true, subtree: true });
};
const observer = new MutationObserver(onTitleChanged);

const clearAppBadge = () => {
  try {
    navigator.clearAppBadge?.();
  } catch {}
};

export const main = async () => {
  pageModifications.register('head title:not([data-xkit])', onTitleChanged);
  document.head.prepend(customTitleElement);
};

export const clean = async () => {
  observer.disconnect();
  customTitleElement.remove();
};
