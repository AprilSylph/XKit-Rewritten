import { keyToCss } from '../../util/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const hiddenAttribute = 'data-tweaks-caught-up-line-title';
const borderAttribute = 'data-tweaks-caught-up-line-border';

export const styleElement = buildStyle(`
  [${hiddenAttribute}] > div { display: none; }
  [${borderAttribute}] > div {
    box-sizing: content-box;
    height: 0px;
    overflow-y: hidden;
    border-top: 4px solid rgb(var(--white-on-dark));
  }

  @media (max-width: 540px) {
    [${borderAttribute}] > div {
      margin-top: 2px;
      border-bottom: 2px solid transparent;
    }
  }
`);

const listTimelineObjectSelector = keyToCss('listTimelineObject');
const tagChicletCarouselLinkSelector = `[data-timeline="/v2/timeline/dashboard"] ${listTimelineObjectSelector} ${keyToCss('tagChicletLink')}`;

const createCaughtUpLine = tagChicletCarouselItems => tagChicletCarouselItems
  .map(getTimelineItemWrapper)
  .filter((element, index, array) => array.indexOf(element) === index)
  .forEach(timelineItem => {
    timelineItem.setAttribute(borderAttribute, '');
    timelineItem.previousElementSibling.setAttribute(hiddenAttribute, '');
  });

export const main = async function () {
  pageModifications.register(tagChicletCarouselLinkSelector, createCaughtUpLine);
};

export const clean = async function () {
  pageModifications.unregister(createCaughtUpLine);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`[${borderAttribute}]`).removeAttr(borderAttribute);
};
