import { onNewPosts } from '../../util/mutations.js';
import { filterPostElements } from '../../util/interface.js';
import { keyToCss } from '../../util/css_map.js';
import { timelineObject } from '../../util/react_props.js';

const postAttributionSelector = keyToCss('postAttribution');
const reblogAttributionSelector = keyToCss('reblogAttribution');

const processPosts = async function (postElements) {
  filterPostElements(postElements).forEach(async postElement => {
    const { postUrl, rebloggedFromUrl } = await timelineObject(postElement);
    const postAttribution = postElement.querySelector(postAttributionSelector);
    const postAttributionLink = postAttribution?.querySelector('a');
    if (postAttributionLink !== undefined) {
      postAttributionLink.href = postUrl;
    }
    const reblogAttribution = postElement.querySelector(reblogAttributionSelector);
    const reblogAttributionLink = reblogAttribution?.querySelector('a');
    if (reblogAttributionLink !== undefined && rebloggedFromUrl !== undefined) {
      reblogAttributionLink.href = rebloggedFromUrl;
    }
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
};
