import { onBaseContainerMutated } from '../../util/mutations.js';
import { translate } from '../../util/language_data.js';
import { addStyle, removeStyle } from '../../util/interface.js';

const excludeClass = 'xkit-no-recommended-blogs-done';
const hiddenClass = 'xkit-no-recommended-blogs-hidden';

let checkOutTheseBlogsSelector;
let topBlogsSelector;

const css = `.${hiddenClass} { display: none; }`;

const checkForRecommendedBlogs = function () {
  [...document.querySelectorAll(`${checkOutTheseBlogsSelector}:not(.${excludeClass}), ${topBlogsSelector}:not(.${excludeClass})`)]
    .forEach(ul => {
      ul.classList.add(excludeClass);
      ul.parentNode.classList.add(hiddenClass);
    });
};

export const main = async function () {
  const checkOutTheseBlogsLabel = await translate('Check out these blogs');
  checkOutTheseBlogsSelector = `aside ul[aria-label="${checkOutTheseBlogsLabel}"]`;

  const topBlogsLabel = await translate('Top %1$s blogs');
  const [topBlogsPrefix, topBlogsSuffix] = topBlogsLabel.split('%1$s');
  topBlogsSelector = `aside ul${topBlogsPrefix ? `[aria-label^="${topBlogsPrefix}"]` : ''}${topBlogsSuffix ? `[aria-label$="${topBlogsSuffix}"]` : ''}`;

  onBaseContainerMutated.addListener(checkForRecommendedBlogs);
  checkForRecommendedBlogs();
  addStyle(css);
};

export const clean = async function () {
  onBaseContainerMutated.removeListener(checkForRecommendedBlogs);
  removeStyle(css);
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
