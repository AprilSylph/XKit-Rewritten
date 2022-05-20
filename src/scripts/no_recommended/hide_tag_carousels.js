import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const hiddenClass = 'xkit-no-recommended-tag-carousels-hidden';

const styleElement = buildStyle(`.${hiddenClass} > div { display: none; }`);

const hideTagCarousels = carouselWrappers => carouselWrappers
  .filter(carouselWrapper => carouselWrapper.querySelector(keyToCss('tagCardCarouselItem')) !== null)
  .map(carouselWrapper => carouselWrapper.closest(keyToCss('listTimelineObject')))
  .forEach(listTimelineObject => {
    listTimelineObject.classList.add(hiddenClass);
    listTimelineObject.previousElementSibling.classList.add(hiddenClass);
  });

export const main = async function () {
  document.head.append(styleElement);

  const carouselWrapperSelector = `${keyToCss('listTimelineObject')} ${keyToCss('carouselWrapper')}`;
  pageModifications.register(carouselWrapperSelector, hideTagCarousels);
};

export const clean = async function () {
  pageModifications.unregister(hideTagCarousels);
  styleElement.remove();
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
