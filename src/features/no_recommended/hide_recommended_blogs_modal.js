import { keyToCss } from '../../utils/css_map.js';
import { blogViewSelector, buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { pageModifications } from '../../utils/mutations.js';

const hiddenAttribute = 'data-no-recommended-blogs-modal-hidden';
const recommendedBlogTitles = [
  'Check out these blogs',
  'Check these out',
].map(translate);

export const styleElement = buildStyle(`[${hiddenAttribute}] { display: none; }`);

const hideModalRecommended = blogsLists =>
  blogsLists
    .filter(ul => ul.matches(blogViewSelector))
    .forEach(ul => ul.parentNode.setAttribute(hiddenAttribute, ''));

const hideModalRecommendedTitles = sidebarTitles =>
  sidebarTitles
    .filter(h1 => h1.matches(blogViewSelector))
    .filter(h1 => recommendedBlogTitles.includes(h1.textContent.trim()))
    .forEach(h1 => h1.closest('aside > *').setAttribute(hiddenAttribute, ''));

export const main = async function () {
  const blogsListSelector = `${keyToCss('desktopContainer')} > ${keyToCss('recommendedBlogs')}`;
  pageModifications.register(blogsListSelector, hideModalRecommended);
  pageModifications.register('aside h1', hideModalRecommendedTitles);
};

export const clean = async function () {
  pageModifications.unregister(hideModalRecommended);
  pageModifications.unregister(hideModalRecommendedTitles);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
