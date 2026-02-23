import { keyToCss } from '../../utils/css_map.js';
import { blogViewSelector, buildStyle } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

const hiddenAttribute = 'data-no-recommended-blogs-modal-hidden';

export const styleElement = buildStyle(`[${hiddenAttribute}] { display: none; }`);

const hideModalRecommended = blogsLists =>
  blogsLists
    .filter(ul => ul.matches(blogViewSelector))
    .forEach(ul => ul.parentNode.setAttribute(hiddenAttribute, ''));

export const main = async function () {
  const blogsListSelector = `${keyToCss('desktopContainer')} > ${keyToCss('recommendedBlogs')}`;
  pageModifications.register(blogsListSelector, hideModalRecommended);
};

export const clean = async function () {
  pageModifications.unregister(hideModalRecommended);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
