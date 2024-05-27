import { onNewPosts } from '../../util/mutations.js';
import { buildStyle, getTimelineItemWrapper, filterPostElements } from '../../util/interface.js';
import { isMyPost, timelineObject } from '../../util/react_props.js';

const timeline = /\/v2\/timeline\/dashboard/;

const hiddenAttribute = 'data-tweaks-hide-liked-posts-hidden';
const styleElement = buildStyle(`[${hiddenAttribute}] article { display: none; }`);

const processPosts = async function (postElements) {
  filterPostElements(postElements, { timeline }).forEach(async postElement => {
    const { liked } = await timelineObject(postElement);
    const myPost = await isMyPost(postElement);

    if (liked && !myPost) getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
  document.documentElement.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
