import { onBaseContainerMutated } from '../../util/mutations.js';
import { translate } from '../../util/language_data.js';
import { addStyle, removeStyle } from '../../util/interface.js';

const excludeClass = 'xkit-no-recommended-blogs-done';
const hiddenClass = 'xkit-no-recommended-blogs-hidden';

let checkOutTheseBlogsLabel;
let topBlogsSelector;

const css = `.${hiddenClass} { display: none; }`;

const checkForRecommendedBlogs = function () {
  [...document.querySelectorAll(`aside > div > h1:not(.${excludeClass})`)]
    .filter(h1 => {
      h1.classList.add(excludeClass);
      return h1.textContent === checkOutTheseBlogsLabel;
    })
    .forEach(h1 => h1.parentNode.classList.add(hiddenClass));

  [...document.querySelectorAll(`${topBlogsSelector}:not(.${excludeClass})`)]
    .forEach(ul => {
      ul.classList.add(excludeClass);
      ul.parentNode.classList.add(hiddenClass);
    });
};

export const main = async function () {
  checkOutTheseBlogsLabel = await translate('Check out these blogs');

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
