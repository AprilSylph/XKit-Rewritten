import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, postSelector, trailItemSelector } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { timelineObject, trailItem } from '../../utils/react_props.js';
import { navigate } from '../../utils/tumblr_helpers.js';

const headerSelector = `${postSelector} header`;
const subheaderSelector = `${headerSelector} ${keyToCss('subheader')}`;
const trailHeaderSelector = keyToCss('trailHeader');

const postAttributionLinkSelector = `${headerSelector} a[rel="author"]`;
const reblogAttributionLinkSelector = `${subheaderSelector} a${keyToCss('blogLink')}`;
const trailAttributionLinkSelector = `${trailHeaderSelector} a[rel="author"]`;

const postContentEventPermalinkSelector = `${keyToCss('postContent')}${keyToCss('hasPermalink')}`;
const trailItemEventPermalinkSelector = `${keyToCss('reblog')}${keyToCss('withTrailItemPermalink')}`;
const footerEventPermalinkSelector = `${keyToCss('footerWrapper')}${keyToCss('isReblogWithAddedContent')}`;
const anyElementEventPermalinkSelector = `:is(
  ${postContentEventPermalinkSelector},
  ${trailItemEventPermalinkSelector},
  ${footerEventPermalinkSelector}
)`;
const hasHoverColorSelector = keyToCss(
  'heightRestrictorExpandButtonWrapper',
  'contentWarningCover',
  'expandTagsButtonWrapper',
);

// This takes advantage of tumblr's special-case code for audio players
const preventPostClickAttributeName = 'data-audio-player';
const preventPostClickAttributeValue = 'xkit-restore-attribution-links';

export const styleElement = buildStyle(`
/**
 * Hides the cover-style permalinks on processed headers, as they are redundant.
 */
${headerSelector}:has([data-router-url]:is(${postAttributionLinkSelector})) [rel="bookmark"],
${trailHeaderSelector}:has([data-router-url]:is(${trailAttributionLinkSelector})) [rel="bookmark"] {
  display: none !important;
}

/**
 * Removes the different background colour when hovering a post body pseudo-permalink.
 * This doesn't have :hover because, on reblogs with contributed content not viewed
 * alone, Tumblr syncs the last reblog and footer's hover state using :has().
 */
${anyElementEventPermalinkSelector}[${preventPostClickAttributeName}] {
  background-color: unset !important;
  cursor: unset !important;
}
${anyElementEventPermalinkSelector}[${preventPostClickAttributeName}] ${hasHoverColorSelector} {
  background-color: unset !important;
}
`);

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
      blog,
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
    const hasCustomTheme = new URL(postUrl).hostname !== 'www.tumblr.com';
    const postRouterUrl = hasCustomTheme
      ? `${blog.blogViewUrl.replace(/\/$/, '')}/${id}${slug ? `/${slug}` : ''}`
      : postUrl;

    const postAttributionLink = postElement.querySelector(postAttributionLinkSelector);
    const reblogAttributionLink = postElement.querySelector(reblogAttributionLinkSelector);
    const trailItemElements = [...postElement.querySelectorAll(trailItemSelector)];

    if (postAttributionLink && postAttributionLink.textContent === postAttributionName) {
      postAttributionLink.dataset.originalHref ??= postAttributionLink.getAttribute('href');
      postAttributionLink.dataset.routerUrl = postRouterUrl;
      postAttributionLink.href = postUrl;
      postAttributionLink.addEventListener('click', onLinkClick, listenerOptions);

      postElement.querySelector(postContentEventPermalinkSelector)?.setAttribute(preventPostClickAttributeName, preventPostClickAttributeValue);
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
          trailAttributionLink.dataset.routerUrl = postRouterUrl;
          trailAttributionLink.href = postUrl;
          postElement.querySelector(footerEventPermalinkSelector)?.setAttribute(preventPostClickAttributeName, preventPostClickAttributeValue);
        } else {
          const hasCustomTheme = new URL(blog.url).hostname !== 'www.tumblr.com';
          trailAttributionLink.dataset.routerUrl = `${blog.blogViewUrl.replace(/\/$/, '')}/${post.id}`;
          trailAttributionLink.href = `${blog.url.replace(/\/$/, '')}${hasCustomTheme ? `/post/${post.id}` : `/${post.id}`}`;
        }

        trailAttributionLink.addEventListener('click', onLinkClick, listenerOptions);
        trailAttributionLink.closest(trailItemEventPermalinkSelector)?.setAttribute(preventPostClickAttributeName, preventPostClickAttributeValue);
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
    `[data-original-href]:is(${postAttributionLinkSelector}, ${reblogAttributionLinkSelector}, ${trailAttributionLinkSelector})`,
  )].forEach(anchorElement => {
    anchorElement.setAttribute('href', anchorElement.dataset.originalHref);
    anchorElement.removeEventListener('click', onLinkClick, listenerOptions);
    delete anchorElement.dataset.originalHref;
    delete anchorElement.dataset.routerUrl;
  });

  [...document.querySelectorAll(
    `[${preventPostClickAttributeName}="${preventPostClickAttributeValue}"]`,
  )].forEach(bodyPermalinkElement => bodyPermalinkElement.removeAttribute(preventPostClickAttributeName));
};
