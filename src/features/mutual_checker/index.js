import { buildStyle, getTimelineItemWrapper, filterPostElements, getPopoverWrapper, notificationSelector } from '../../utils/interface.js';
import { blogData, notificationObject, timelineObject } from '../../utils/react_props.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';
import { primaryBlogName } from '../../utils/user.js';
import { keyToCss } from '../../utils/css_map.js';
import { onNewPosts, onNewNotifications, pageModifications } from '../../utils/mutations.js';
import { div, dom } from '../../utils/dom.js';
import { getPreferences } from '../../utils/preferences.js';
import { translate } from '../../utils/language_data.js';
import { followingTimelineSelector } from '../../utils/timeline_id.js';

const mutualIconClass = 'xkit-mutual-icon';
const hiddenAttribute = 'data-mutual-checker-hidden';
const lengthenedClass = 'xkit-mutual-checker-lengthened';
const controlsClass = 'xkit-mutual-checker-controls';
const mutualsClass = 'from-mutual';
const postAttributionSelector = 'header a[rel="author"]';

const onlyMutualsStyleElement = buildStyle(`${notificationSelector}:not([data-mutuals]) { display: none !important; }`);

const path = 'M593 500q0-45-22.5-64.5T500 416t-66.5 19-18.5 65 18.5 64.5T500 583t70.5-19 22.5-64zm-90 167q-44 0-83.5 18.5t-63 51T333 808v25h334v-25q0-39-22-71.5t-59.5-51T503 667zM166 168l14-90h558l12-78H180q-8 0-51 63l-42 63v209q-19 3-52 3t-33-3q-1 1 0 27 3 53 0 53l32-2q35-1 53 2v258H2l-3 40q-2 41 3 41 42 0 64-1 7-1 21 1v246h756q25 0 42-13 14-10 22-27 5-13 8-28l1-13V275q0-47-3-63-5-24-22.5-34T832 168H166zm667 752H167V754q17 0 38.5-6.5T241 730q16-12 16-26 0-21-33-28-19-4-57-4-3 0-1-51 2-37 1-36V421q88 0 90-48 1-20-33-30-24-6-57-6-4 0-2-44l2-43h635q14 0 22.5 11t8.5 26v543q0 5 4 26 5 30 5 42 1 22-9 22z';

const following = {};
const followingYou = {};

let showOnlyMutuals;
let showOnlyMutualNotifications;

const styleElement = buildStyle(`
  svg.xkit-mutual-icon {
    vertical-align: text-bottom;

    height: 1.125rem;
    margin-top: 0;
    margin-left: 0;
    margin-right: 0.5ch;

    /* fixes hover when covered by the "permalink" <a> element */
    isolation: isolate;
  }

  [data-show-only-mutuals="on"] ~ div > [${hiddenAttribute}] {
    content: linear-gradient(transparent, transparent);
    height: 0;
  }

  .${lengthenedClass} {
    min-height: 100vh;
  }

  .${controlsClass} {
    color: var(--blog-title-color, rgb(var(--white-on-dark)));
    display: flex;
    font-weight: 700;
    margin-bottom: 20px;
  }

  .${controlsClass} > a {
    flex: 1;
    padding: 14px 16px;
    text-align: center;
    text-decoration: none;
    text-transform: capitalize;
  }

  .${controlsClass} > a {
    cursor: pointer;
  }

  [data-show-only-mutuals="on"].${controlsClass} > a[data-mode="on"],
  [data-show-only-mutuals="off"].${controlsClass} > a[data-mode="off"] {
    box-shadow: inset 0 -3px 0 var(--blog-link-color, rgb(var(--deprecated-accent)));
    color: var(--blog-link-color, rgb(var(--deprecated-accent)));
  }

  ${keyToCss('blogCardBlogLink')} {
    display: flex;
  }

  ${keyToCss('blogCardBlogLink')} svg.xkit-mutual-icon {
    position: relative;
    top: 3px;

    box-sizing: border-box;
    flex: none;
    height: 1.5rem;
    padding: 0.1875rem 0;
  }
`);

const storageKey = 'mutual_checker.mode';

const lengthenTimeline = async (timeline) => {
  if (!timeline.querySelector(keyToCss('manualPaginatorButtons'))) {
    timeline.classList.add(lengthenedClass);
  }
};

const createButton = (textContent, onclick, mode) => {
  const button = Object.assign(document.createElement('a'), { textContent, onclick });
  button.dataset.mode = mode;
  return button;
};

const addControls = async (timelineElement) => {
  const handleClick = async ({ currentTarget: { dataset: { mode } } }) => {
    controls.dataset.showOnlyMutuals = mode;

    browser.storage.local.set({ [storageKey]: mode });
  };

  const controls = div({ class: controlsClass }, [
    createButton(translate('From Mutuals'), handleClick, 'on'),
    createButton(translate('From Everyone'), handleClick, 'off')
  ]);

  timelineElement.prepend(controls);

  lengthenTimeline(timelineElement);
  const { [storageKey]: mode = 'on' } = await browser.storage.local.get(storageKey);
  controls.dataset.showOnlyMutuals = mode;
};

const processNotifications = (notificationElements) => {
  notificationElements.forEach(async notificationElement => {
    const notification = await notificationObject(notificationElement);

    if (notification?.mutuals || notification?.title?.relationshipLabel === 'mutuals') {
      notificationElement.setAttribute('data-mutuals', '');
    }
  });
};

const alreadyProcessed = postElement =>
  postElement.classList.contains(mutualsClass) &&
  postElement.querySelector(`.${mutualIconClass}`);

const addIcons = function (postElements) {
  if (showOnlyMutuals) {
    [...document.querySelectorAll(`${followingTimelineSelector}:not(:has(.${controlsClass}))`)].forEach(addControls);
  }

  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    if (alreadyProcessed(postElement)) return;

    const postAttribution = postElement.querySelector(postAttributionSelector);
    if (postAttribution === null) { return; }

    const blogName = postAttribution.textContent.trim();
    if (!blogName) return;

    const followingBlog = await getIsFollowing(blogName, postElement);
    if (!followingBlog) { return; }

    const isMutual = await getIsFollowingYou(blogName);
    if (isMutual) {
      postElement.classList.add(mutualsClass);
      const iconTarget = getPopoverWrapper(postAttribution) ?? postAttribution;
      iconTarget?.before(createIcon(blogName));
    } else if (showOnlyMutuals) {
      getTimelineItemWrapper(postElement)?.setAttribute(hiddenAttribute, '');
    }
  });
};

const addBlogCardIcons = blogCardLinks =>
  blogCardLinks.forEach(async blogCardLink => {
    const blogName = blogCardLink.querySelector(keyToCss('blogLinkShort'))?.textContent || blogCardLink?.textContent;
    if (!blogName) return;

    const followingBlog = await getIsFollowing(blogName, blogCardLink);
    if (!followingBlog) return;

    const isMutual = await getIsFollowingYou(blogName);
    if (isMutual) {
      blogCardLink.before(createIcon(blogName, getComputedStyle(blogCardLink).color));
    }
  });

const getIsFollowing = async (blogName, element) => {
  if (following[blogName] === undefined) {
    const blog = [
      await blogData(element),
      (await timelineObject(element))?.blog,
      (await timelineObject(element))?.authorBlog
    ].find((data) => blogName === data?.name);

    following[blogName] = blog
      ? Promise.resolve(blog.followed && !blog.isMember)
      : apiFetch(`/v2/blog/${blogName}/info`)
        .then(({ response: { blog: { followed } } }) => followed)
        .catch(() => Promise.resolve(false));
  }
  return following[blogName];
};

const getIsFollowingYou = (blogName) => {
  if (followingYou[blogName] === undefined) {
    followingYou[blogName] = apiFetch(`/v2/blog/${primaryBlogName}/followed_by`, { queryParams: { query: blogName } })
      .then(({ response: { followedBy } }) => followedBy)
      .catch(() => Promise.resolve(false));
  }
  return followingYou[blogName];
};

export const main = async function () {
  if (primaryBlogName === undefined) return;
  document.documentElement.append(styleElement);

  ({ showOnlyMutuals, showOnlyMutualNotifications } = await getPreferences('mutual_checker'));
  following[primaryBlogName] = Promise.resolve(false);

  onNewPosts.addListener(addIcons);
  pageModifications.register(`${keyToCss('blogCard')} ${keyToCss('blogCardBlogLink')} > a`, addBlogCardIcons);

  if (showOnlyMutualNotifications) {
    document.documentElement.append(onlyMutualsStyleElement);
    onNewNotifications.addListener(processNotifications);
  }
};

const createIcon = (blogName, color = 'rgb(var(--black))') =>
  dom('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    class: mutualIconClass,
    viewBox: '0 0 1000 1000',
    fill: color
  }, null, [
    dom('title', { xmlns: 'http://www.w3.org/2000/svg' }, null, [
      translate('{{blogNameLink /}} follows you!').replace('{{blogNameLink /}}', blogName)
    ]),
    dom('path', { xmlns: 'http://www.w3.org/2000/svg', d: path })
  ]);

export const clean = async function () {
  onNewPosts.removeListener(addIcons);
  pageModifications.unregister(addBlogCardIcons);
  if (showOnlyMutualNotifications) {
    onlyMutualsStyleElement.remove();
    onNewNotifications.removeListener(processNotifications);
  }
  styleElement.remove();

  $(`.${mutualsClass}`).removeClass(mutualsClass);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`.${mutualIconClass}`).remove();
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${controlsClass}`).remove();
};
