import { onNewPosts } from '../../util/mutations.js';
import { keyToCss } from '../../util/css_map.js';
import { timelineObject } from '../../util/react_props.js';
import { navigate } from '../../util/tumblr_helpers.js';

const postAttributionLinkSelector = `header ${keyToCss('attributionHeaderText')} a`;
const reblogAttributionLinkSelector = `header ${keyToCss('rebloggedFromName')} a`;

const onLinkClick = event => {
  event.stopPropagation();
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

  const { blogName, postId } = event.currentTarget.dataset;
  if (blogName && postId) {
    event.preventDefault();
    navigate(`/@${blogName}/${postId}`);
  }
};

const processPosts = async function (postElements) {
  postElements.forEach(async postElement => {
    const {
      blogName,
      id,
      postUrl,
      rebloggedFromId,
      rebloggedFromName,
      rebloggedFromUrl
    } = await timelineObject(postElement);
    const postAttributionLink = postElement.querySelector(postAttributionLinkSelector);

    if (postAttributionLink !== null) {
      postAttributionLink.href = postUrl;
      postAttributionLink.dataset.blogName = blogName;
      postAttributionLink.dataset.postId = id;
      postAttributionLink.addEventListener('click', onLinkClick, { capture: true });
    }

    const reblogAttributionLink = postElement.querySelector(reblogAttributionLinkSelector);
    if (reblogAttributionLink !== null && rebloggedFromUrl !== undefined) {
      reblogAttributionLink.href = rebloggedFromUrl;
      reblogAttributionLink.dataset.blogName = rebloggedFromName;
      reblogAttributionLink.dataset.postId = rebloggedFromId;
      reblogAttributionLink.addEventListener('click', onLinkClick, { capture: true });
    }
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
};
