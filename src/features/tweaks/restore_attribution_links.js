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

  const { href } = event.currentTarget;
  const { blogName, postId } = event.currentTarget.dataset;

  if (href.startsWith('https://www.tumblr.com')) {
    event.preventDefault();
    navigate(href.replace(/^https:\/\/www.tumblr.com/, ''));
  } else if (blogName && postId) {
    event.preventDefault();
    navigate(`/@${blogName}/${postId}`);
  }
};

const listenerOptions = { capture: true };

const processPosts = async function (postElements) {
  postElements.forEach(async postElement => {
    const {
      authorBlog,
      blogName,
      community,
      id,
      postUrl,
      rebloggedFromId,
      rebloggedFromName,
      rebloggedFromUrl,
    } = await timelineObject(postElement);
    const postAttributionName = (!!community && authorBlog?.name) || blogName;

    const postAttributionLink = postElement.querySelector(postAttributionLinkSelector);
    const reblogAttributionLink = postElement.querySelector(reblogAttributionLinkSelector);
    const trailItemElements = [...postElement.querySelectorAll(trailItemSelector)];

    if (postAttributionLink && postAttributionLink.textContent === postAttributionName) {
      postAttributionLink.dataset.originalHref ??= postAttributionLink.getAttribute('href');
      postAttributionLink.dataset.blogName = blogName;
      postAttributionLink.dataset.postId = id;
      postAttributionLink.href = postUrl;
      postAttributionLink.addEventListener('click', onLinkClick, listenerOptions);
    }

    if (reblogAttributionLink && reblogAttributionLink.textContent === rebloggedFromName) {
      reblogAttributionLink.dataset.originalHref ??= reblogAttributionLink.getAttribute('href');
      reblogAttributionLink.dataset.blogName = rebloggedFromName;
      reblogAttributionLink.dataset.postId = rebloggedFromId;
      reblogAttributionLink.href = rebloggedFromUrl;
      reblogAttributionLink.addEventListener('click', onLinkClick, listenerOptions);
    }

    trailItemElements.forEach(async trailItemElement => {
      const { blog, post, isContributedContent } = await trailItem(trailItemElement);
      const trailAttributionLink = trailItemElement.querySelector(trailAttributionLinkSelector);

      if (trailAttributionLink && trailAttributionLink.textContent === blog?.name && post?.id) {
        trailAttributionLink.dataset.originalHref ??= trailAttributionLink.getAttribute('href');
        trailAttributionLink.dataset.blogName = blog.name;
        trailAttributionLink.dataset.postId = post.id;

        if (isContributedContent) {
          trailAttributionLink.href = postUrl;
        } else if (blog.url.startsWith('https://www.tumblr.com')) {
          trailAttributionLink.href = `${blog.url.replace(/\/$/, '')}/${post.id}`;
        } else {
          trailAttributionLink.href = `${blog.url.replace(/\/$/, '')}/post/${post.id}`;
        }

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
