import { keyToCss } from '../../utils/css_map.js';
import { blogViewSelector, buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { pageModifications } from '../../utils/mutations.js';

const hiddenAttribute = 'data-no-recommended-blogs-hidden';

export const styleElement = buildStyle(`[${hiddenAttribute}] { display: none; }`);

const hideDashboardRecommended = function (sidebarTitles) {
  sidebarTitles
    .filter(h1 => h1.textContent === translate('Check out these blogs'))
    .forEach(h1 => h1.closest('aside > *').setAttribute(hiddenAttribute, ''));
};

const hideTagPageRecommended = blogsLists =>
  blogsLists
    .filter(ul => !ul.matches(blogViewSelector))
    .forEach(ul => ul.parentNode.setAttribute(hiddenAttribute, ''));

export const main = async function () {
  pageModifications.register('aside h1', hideDashboardRecommended);

  const blogsListSelector = `${keyToCss('desktopContainer')} > ${keyToCss('recommendedBlogs')}`;
  pageModifications.register(blogsListSelector, hideTagPageRecommended);
};

export const clean = async function () {
  pageModifications.unregister(hideDashboardRecommended);
  pageModifications.unregister(hideTagPageRecommended);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
