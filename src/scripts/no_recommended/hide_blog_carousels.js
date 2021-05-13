import { keyToCss } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';
import { onNewPosts } from '../../util/mutations.js';

const excludeClass = 'xkit-no-recommended-blog-carousels-done';
const hiddenClass = 'xkit-no-recommended-blog-carousels-hidden';

const css = `.${hiddenClass} > div { display: none; }`;

let blogCarouselSelector;

const hideBlogCarousels = async function () {
  [...document.querySelectorAll('[data-id] + :not([data-id]) + :not([data-id])')]
    .filter(timelineObject => {
      timelineObject.classList.add(excludeClass);
      return timelineObject.querySelector(blogCarouselSelector) !== null;
    })
    .forEach(timelineObject => {
      timelineObject.classList.add(hiddenClass);
      timelineObject.previousElementSibling.classList.add(hiddenClass);
    });
};

export const main = async function () {
  blogCarouselSelector = await keyToCss('blogCarousel');
  addStyle(css);

  onNewPosts.addListener(hideBlogCarousels);
  hideBlogCarousels();
};

export const clean = async function () {
  removeStyle(css);

  onNewPosts.removeListener(hideBlogCarousels);
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
