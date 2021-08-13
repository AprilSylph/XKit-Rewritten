import { onBaseContainerMutated } from '../../util/mutations.js';
import { translate } from '../../util/language_data.js';
import { addStyle, removeStyle } from '../../util/interface.js';
import { descendantSelector } from '../../util/css_map.js';

const excludeClass = 'xkit-no-recommended-blogs-done';
const hiddenClass = 'xkit-no-recommended-blogs-hidden';

let recommendedBlogsLabel;
let recommendedBlogsPattern;

let tagPageTitleSelector;

const css = `.${hiddenClass} { display: none; }`;

const checkForRecommendedBlogs = function () {
  [...document.querySelectorAll(`aside > div > h1:not(.${excludeClass})`)]
    .filter(h1 => {
      h1.classList.add(excludeClass);
      return h1.textContent === recommendedBlogsLabel;
    })
    .forEach(h1 => h1.parentNode.classList.add(hiddenClass));

  [...document.querySelectorAll(tagPageTitleSelector)]
    .filter(title => !title.classList.contains(excludeClass))
    .filter(title => {
      title.classList.add(excludeClass);
      return recommendedBlogsPattern.test(title.textContent);
    })
    .forEach(title => title.parentNode.classList.add(hiddenClass));
};

export const main = async function () {
  recommendedBlogsLabel = await translate('Check out these blogs');

  const tagPageLabel = await translate('Top %1$s blogs');
  recommendedBlogsPattern = new RegExp(`^${tagPageLabel.replace('%1$s', '.*')}$`);

  tagPageTitleSelector = await descendantSelector('desktopContainer', 'title');

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
