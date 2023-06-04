import { onNewPosts } from '../../util/mutations.js';
import { keyToCss } from '../../util/css_map.js';
import { timelineObject } from '../../util/react_props.js';

const postAttributionLinkSelector = `${keyToCss('postAttribution')} a`;
const reblogAttributionLinkSelector = `${keyToCss('reblogAttribution')} a`;

const processPosts = async function (postElements) {
  postElements.forEach(async postElement => {
    const { postUrl, rebloggedFromUrl } = await timelineObject(postElement);
    const postAttributionLink = postElement.querySelector(postAttributionLinkSelector);
    if (postAttributionLink !== null) {
      postAttributionLink.href = postUrl;
    }
    const reblogAttributionLink = postElement.querySelector(reblogAttributionLinkSelector);
    if (reblogAttributionLink !== null && rebloggedFromUrl !== undefined) {
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
