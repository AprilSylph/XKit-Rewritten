import { keyToCss } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';
import { onNewPosts } from '../../util/mutations.js';

const excludeClass = 'xkit-no-recommended-tag-carousels-done';
const hiddenClass = 'xkit-no-recommended-tag-carousels-hidden';

const css = `.${hiddenClass} > div { display: none; }`;

let tagCardCarouselContainerSelector;

const hideTagCarousels = async function () {
  [...document.querySelectorAll('[data-id] + :not([data-id]) + :not([data-id])')]
    .filter(timelineObject => {
      timelineObject.classList.add(excludeClass);
      return timelineObject.querySelector(tagCardCarouselContainerSelector) !== null;
    })
    .forEach(timelineObject => {
      timelineObject.classList.add(hiddenClass);
      timelineObject.previousElementSibling.classList.add(hiddenClass);
    });
};

export const main = async function () {
  tagCardCarouselContainerSelector = await keyToCss('tagCardCarouselContainer');
  addStyle(css);

  onNewPosts.addListener(hideTagCarousels);
  hideTagCarousels();
};

export const clean = async function () {
  removeStyle(css);

  onNewPosts.removeListener(hideTagCarousels);
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
