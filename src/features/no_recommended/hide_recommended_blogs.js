import { keyToCss } from '../../utils/css_map.js';
import { pageModifications } from '../../utils/mutations.js';
import { translate } from '../../utils/language_data.js';
import { blogViewSelector, buildStyle } from '../../utils/interface.js';

const hiddenAttribute = 'data-no-recommended-blogs-hidden';

const styleElement = buildStyle(`[${hiddenAttribute}] { display: none; }`);

const hideDashboardRecommended = sidebarTitles => {
  sidebarTitles
    .filter(h1 => h1.textContent === translate('Check out these blogs'))
    .forEach(h1 => h1.closest('aside > *').setAttribute(hiddenAttribute, ''));
};

const hideTagPageRecommended = blogsLists =>
  blogsLists
    .filter(ul => !ul.matches(blogViewSelector))
    .forEach(ul => ul.parentNode.setAttribute(hiddenAttribute, ''));

export const main = async () => {
  pageModifications.register('aside h1', hideDashboardRecommended);

  const blogsListSelector = `${keyToCss('desktopContainer')} > ${keyToCss('recommendedBlogs')}`;
  pageModifications.register(blogsListSelector, hideTagPageRecommended);

  document.documentElement.append(styleElement);
};

export const clean = async () => {
  pageModifications.unregister(hideDashboardRecommended);
  pageModifications.unregister(hideTagPageRecommended);
  styleElement.remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
