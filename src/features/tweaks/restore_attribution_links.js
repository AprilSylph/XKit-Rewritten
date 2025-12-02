import { onNewPosts } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { timelineObject, trailItem } from '../../utils/react_props.js';
import { navigate } from '../../utils/tumblr_helpers.js';
import { trailItemSelector } from '../../utils/interface.js';

const postAttributionLinkSelector = 'header a[rel="author"]';
const reblogAttributionLinkSelector = `header ${keyToCss('subheader')} a${keyToCss('blogLink')}`;
const trailAttributionLinkSelector = `${keyToCss('trailHeader')} a[rel="author"]`;

const onLinkClick = event => {
  event.stopPropagation();
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

  const { blogName, postId } = event.currentTarget.dataset;
  if (blogName && postId) {
    event.preventDefault();
    navigate(`/@${blogName}/${postId}`);
  }
};

const listenerOptions = { capture: true };

const processPosts = async function (postElements) {
  postElements.forEach(async postElement => {
    const {
      blogName,
      id,
      postUrl,
      rebloggedFromId,
      rebloggedFromName,
      rebloggedFromUrl,
    } = await timelineObject(postElement);
    const postAttributionLink = postElement.querySelector(postAttributionLinkSelector);
    const reblogAttributionLink = postElement.querySelector(reblogAttributionLinkSelector);
    const trailItemElements = [...postElement.querySelectorAll(trailItemSelector)];

    if (postAttributionLink && postAttributionLink.textContent === blogName) {
      postAttributionLink.dataset.originalHref ??= postAttributionLink.getAttribute('href');
      postAttributionLink.href = postUrl;
      postAttributionLink.dataset.blogName = blogName;
      postAttributionLink.dataset.postId = id;
      postAttributionLink.addEventListener('click', onLinkClick, listenerOptions);
    }

    if (reblogAttributionLink && reblogAttributionLink.textContent === rebloggedFromName) {
      reblogAttributionLink.dataset.originalHref ??= reblogAttributionLink.getAttribute('href');
      reblogAttributionLink.href = rebloggedFromUrl;
      reblogAttributionLink.dataset.blogName = rebloggedFromName;
      reblogAttributionLink.dataset.postId = rebloggedFromId;
      reblogAttributionLink.addEventListener('click', onLinkClick, listenerOptions);
    }

    trailItemElements.forEach(async trailItemElement => {
      const { blog, post } = await trailItem(trailItemElement);
      const trailAttributionLink = trailItemElement.querySelector(trailAttributionLinkSelector);

      if (trailAttributionLink && trailAttributionLink.textContent === blog?.name && post?.id) {
        trailAttributionLink.dataset.originalHref ??= trailAttributionLink.getAttribute('href');
        trailAttributionLink.href = `/@${blog.name}/${post.id}`;
        trailAttributionLink.dataset.blogName = blog.name;
        trailAttributionLink.dataset.postId = post.id;
        trailAttributionLink.addEventListener('click', onLinkClick, listenerOptions);
      }
    });
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  [...document.querySelectorAll(
    `[data-original-href]:is(${postAttributionLinkSelector}, ${reblogAttributionLinkSelector}, ${trailAttributionLinkSelector})`
  )].forEach(anchorElement => {
    anchorElement.setAttribute('href', anchorElement.dataset.originalHref);
    anchorElement.removeEventListener('click', onLinkClick, listenerOptions);
    delete anchorElement.dataset.originalHref;
  });
};
