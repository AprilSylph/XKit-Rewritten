import { onNewPosts } from '../../util/mutations.js';
import { buildStyle, getTimelineItemWrapper, filterPostElements } from '../../util/interface.js';
import { isMyPost } from '../../util/react_props.js';

const excludeClass = 'xkit-tweaks-hide-my-posts-done';
const timeline = /\/v2\/timeline\/dashboard/;

// todo: update for future patio id tweaks
const timelineId = /(^\/dashboard\/following$)|(^following-)/;

const hiddenAttribute = 'data-tweaks-hide-my-posts-hidden';
const styleElement = buildStyle(`[${hiddenAttribute}] article { display: none; }`);

const processPosts = async function (postElements) {
  filterPostElements(postElements, { excludeClass, timeline, timelineId }).forEach(async postElement => {
    const myPost = await isMyPost(postElement);

    if (myPost) {
      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
    }
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
  document.documentElement.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
