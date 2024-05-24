import { keyToCss } from '../../util/css_map.js';
import { pageModifications } from '../../util/mutations.js';
import { blogViewSelector, buildStyle } from '../../util/interface.js';

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
