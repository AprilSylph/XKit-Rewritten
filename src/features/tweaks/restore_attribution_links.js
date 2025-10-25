import { onNewPosts } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { timelineObject } from '../../utils/react_props.js';
import { navigate } from '../../utils/tumblr_helpers.js';

const postAttributionLinkSelector = 'header a[rel="author"]';
const reblogAttributionLinkSelector = `
  header ${keyToCss('rebloggedFromName')} a,
  header ${keyToCss('subheader')} a${keyToCss('blogLink')}
`;

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

    if (postAttributionLink && postAttributionLink.textContent === blogName) {
      postAttributionLink.href = postUrl;
      postAttributionLink.dataset.blogName = blogName;
      postAttributionLink.dataset.postId = id;
      postAttributionLink.addEventListener('click', onLinkClick, { capture: true });
    }

    const reblogAttributionLink = postElement.querySelector(reblogAttributionLinkSelector);
    if (reblogAttributionLink && reblogAttributionLink.textContent === rebloggedFromName) {
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
