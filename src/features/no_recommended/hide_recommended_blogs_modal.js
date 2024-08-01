import { keyToCss } from '../../utils/css_map.js';
import { pageModifications } from '../../utils/mutations.js';
import { blogViewSelector, buildStyle } from '../../utils/interface.js';

const hiddenAttribute = 'data-no-recommended-blogs-modal-hidden';

const styleElement = buildStyle(`[${hiddenAttribute}] { display: none; }`);

const hideModalRecommended = blogsLists =>
  blogsLists
    .filter(ul => ul.matches(blogViewSelector))
    .forEach(ul => ul.parentNode.setAttribute(hiddenAttribute, ''));

export const main = async () => {
  const blogsListSelector = `${keyToCss('desktopContainer')} > ${keyToCss('recommendedBlogs')}`;
  pageModifications.register(blogsListSelector, hideModalRecommended);

  document.documentElement.append(styleElement);
};

export const clean = async () => {
  pageModifications.unregister(hideModalRecommended);
  styleElement.remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
