import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';
import { followingTimelineSelector } from '../../utils/timeline_id.js';

const hiddenAttribute = 'data-tweaks-caught-up-line-title';
const borderAttribute = 'data-tweaks-caught-up-line-border';

export const styleElement = buildStyle(`
  [${hiddenAttribute}] > div { display: none; }
  [${borderAttribute}] > div {
    height: 0px;
    overflow-y: hidden;
  }
  [${borderAttribute}]::before {
    display: block;
    height: 4px;

    background-color: rgb(var(--white-on-dark));
    content: "";
  }

  @media (max-width: 540px) {
    [${borderAttribute}]::before {
      margin: 2px 0;
    }
  }
`);

const listTimelineObjectSelector = keyToCss('listTimelineObject');
const tagChicletCarouselLinkSelector = `${followingTimelineSelector} ${listTimelineObjectSelector} ${keyToCss('tagChicletLink')}`;

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
