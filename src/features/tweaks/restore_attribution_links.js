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

  const { routerUrl } = event.currentTarget.dataset;
  if (!routerUrl.startsWith('https://www.tumblr.com/')) return;

  event.preventDefault();
  if (routerUrl === location.href) return;

  navigate(new URL(routerUrl).pathname);
};

const listenerOptions = { capture: true };

const processPosts = async function (postElements) {
  postElements.forEach(async postElement => {
    const {
      authorBlog,
      blog: { blogViewUrl },
      blogName,
      community,
      id,
      parentPostUrl,
      postUrl,
      rebloggedFromName,
      rebloggedFromUrl,
      slug,
    } = await timelineObject(postElement);
    const postAttributionName = (!!community && authorBlog?.name) || blogName;
    const routerPostUrl = new URL(postUrl).hostname === 'www.tumblr.com'
      ? postUrl
      : `${blogViewUrl.replace(/\/$/, '')}/${id}${slug ? `/${slug}` : ''}`;

    const postAttributionLink = postElement.querySelector(postAttributionLinkSelector);
    const reblogAttributionLink = postElement.querySelector(reblogAttributionLinkSelector);
    const trailItemElements = [...postElement.querySelectorAll(trailItemSelector)];

    if (postAttributionLink && postAttributionLink.textContent === postAttributionName) {
      postAttributionLink.dataset.originalHref ??= postAttributionLink.getAttribute('href');
      postAttributionLink.dataset.routerUrl = routerPostUrl;
      postAttributionLink.href = postUrl;
      postAttributionLink.addEventListener('click', onLinkClick, listenerOptions);
    }

    if (reblogAttributionLink && reblogAttributionLink.textContent === rebloggedFromName) {
      reblogAttributionLink.dataset.originalHref ??= reblogAttributionLink.getAttribute('href');
      reblogAttributionLink.dataset.routerUrl = parentPostUrl;
      reblogAttributionLink.href = rebloggedFromUrl;
      reblogAttributionLink.addEventListener('click', onLinkClick, listenerOptions);
    }

    trailItemElements.forEach(async trailItemElement => {
      const { blog, post, isContributedContent } = await trailItem(trailItemElement);
      const trailAttributionLink = trailItemElement.querySelector(trailAttributionLinkSelector);

      if (trailAttributionLink && trailAttributionLink.textContent === blog?.name && post?.id) {
        trailAttributionLink.dataset.originalHref ??= trailAttributionLink.getAttribute('href');

        if (isContributedContent) {
          trailAttributionLink.dataset.routerUrl = routerPostUrl;
          trailAttributionLink.href = postUrl;
        } else {
          const hasCustomTheme = new URL(blog.url).hostname !== 'www.tumblr.com';
          trailAttributionLink.dataset.routerUrl = `${blog.blogViewUrl.replace(/\/$/, '')}/${post.id}`;
          trailAttributionLink.href = `${blog.url.replace(/\/$/, '')}${hasCustomTheme ? `/post/${post.id}` : `/${post.id}`}`;
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
    delete anchorElement.dataset.routerUrl;
  });
};
