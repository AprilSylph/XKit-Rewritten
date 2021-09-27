import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { onNewPosts } from '../../util/mutations.js';

const hiddenClass = 'xkit-no-recommended-tag-carousels-hidden';

const styleElement = buildStyle(`.${hiddenClass} > div { display: none; }`);

let carouselWrapperSelector;
let tagCardCarouselItemSelector;
let listTimelineObjectSelector;

const hideTagCarousels = async function () {
  [...document.querySelectorAll(carouselWrapperSelector)]
    .filter(carouselWrapper => carouselWrapper.querySelector(tagCardCarouselItemSelector) !== null)
    .map(carouselWrapper => carouselWrapper.closest(listTimelineObjectSelector))
    .forEach(listTimelineObject => {
      listTimelineObject?.classList.add(hiddenClass);
      listTimelineObject?.previousElementSibling.classList.add(hiddenClass);
    });
};

export const main = async function () {
  carouselWrapperSelector = await keyToCss('carouselWrapper');
  tagCardCarouselItemSelector = await keyToCss('tagCardCarouselItem');
  listTimelineObjectSelector = await keyToCss('listTimelineObject');

  document.head.append(styleElement);

  onNewPosts.addListener(hideTagCarousels);
  hideTagCarousels();
};

export const clean = async function () {
  styleElement.remove();

  onNewPosts.removeListener(hideTagCarousels);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
