import { keyToCss } from '../../util/css_map.js';
import { pageModifications } from '../../util/mutations.js';
import { translate } from '../../util/language_data.js';
import { buildStyle } from '../../util/interface.js';

const hiddenAttribute = 'data-no-recommended-blogs-hidden';

const styleElement = buildStyle(`[${hiddenAttribute}] { display: none; }`);

const hideDashboardRecommended = function (sidebarTitles) {
  sidebarTitles
    .filter(h1 => h1.textContent === translate('Check out these blogs'))
    .forEach(h1 => h1.parentNode.setAttribute(hiddenAttribute, ''));
};

const hideTagPageRecommended = topBlogsLists => topBlogsLists.forEach(ul => ul.setAttribute(hiddenAttribute, ''));

export const main = async function () {
  pageModifications.register('aside > div > h1', hideDashboardRecommended);

  const topBlogsSelector = `${keyToCss('desktopContainer')} > ${keyToCss('recommendedBlogs')}`;
  pageModifications.register(topBlogsSelector, hideTagPageRecommended);

  document.documentElement.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(hideDashboardRecommended);
  pageModifications.unregister(hideTagPageRecommended);
  styleElement.remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
