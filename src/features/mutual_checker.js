import { buildStyle, getTimelineItemWrapper, filterPostElements, getPopoverWrapper } from '../utils/interface.js';
import { blogData, notificationObject, timelineObject } from '../utils/react_props.js';
import { apiFetch } from '../utils/tumblr_helpers.js';
import { primaryBlogName } from '../utils/user.js';
import { keyToCss } from '../utils/css_map.js';
import { onNewPosts, onNewNotifications, pageModifications } from '../utils/mutations.js';
import { dom } from '../utils/dom.js';
import { getPreferences } from '../utils/preferences.js';
import { translate } from '../utils/language_data.js';
import { followingTimelineSelector } from '../utils/timeline_id.js';

const mutualIconClass = 'xkit-mutual-icon';
const hiddenAttribute = 'data-mutual-checker-hidden';
const mutualsClass = 'from-mutual';
const postAttributionSelector = 'header a[rel="author"]';

const onlyMutualsStyleElement = buildStyle(`${keyToCss('notification')}:not([data-mutuals]) { display: none !important; }`);

const regularPath = 'M593 500q0-45-22.5-64.5T500 416t-66.5 19-18.5 65 18.5 64.5T500 583t70.5-19 22.5-64zm-90 167q-44 0-83.5 18.5t-63 51T333 808v25h334v-25q0-39-22-71.5t-59.5-51T503 667zM166 168l14-90h558l12-78H180q-8 0-51 63l-42 63v209q-19 3-52 3t-33-3q-1 1 0 27 3 53 0 53l32-2q35-1 53 2v258H2l-3 40q-2 41 3 41 42 0 64-1 7-1 21 1v246h756q25 0 42-13 14-10 22-27 5-13 8-28l1-13V275q0-47-3-63-5-24-22.5-34T832 168H166zm667 752H167V754q17 0 38.5-6.5T241 730q16-12 16-26 0-21-33-28-19-4-57-4-3 0-1-51 2-37 1-36V421q88 0 90-48 1-20-33-30-24-6-57-6-4 0-2-44l2-43h635q14 0 22.5 11t8.5 26v543q0 5 4 26 5 30 5 42 1 22-9 22z';
const aprilFoolsPath = 'M858 352q-6-14-8-35-2-12-4-38-3-38-6-54-7-28-22-43t-43-22q-16-3-54-6-26-2-38-4-21-2-34.5-8T619 124q-9-7-28-24-29-25-44-34-24-16-47-16t-47 16q-15 9-44 34-19 17-28 24-16 12-29.5 18t-34.5 8q-12 2-38 4-38 3-54 6-28 7-43 22t-22 43q-3 16-6 54-2 26-4 38-2 21-8 34.5T124 381q-7 9-24 28-25 29-34 44-16 24-16 47t16 47q9 15 34 44 17 19 24 28 12 16 18 29.5t8 34.5q2 12 4 38 3 38 6 54 7 28 22 43t43 22q16 3 54 6 26 2 38 4 21 2 34.5 8t29.5 18q9 7 28 24 29 25 44 34 24 16 47 16t47-16q15-9 44-34 19-17 28-24 16-12 29.5-18t34.5-8q12-2 38-4 38-3 54-6 28-7 43-22t22-43q3-16 6-54 2-26 4-38 2-21 8-34.5t18-29.5q7-9 24-28 25-29 34-44 16-24 16-47t-16-47q-9-15-34-44-17-19-24-28-12-16-18-29zm-119 62L550 706q-10 17-26.5 27T488 745l-11 1q-34 0-59-24L271 584q-26-25-27-60.5t23.5-61.5 60.5-27.5 62 23.5l71 67 132-204q20-30 55-38t65 11.5 37.5 54.5-11.5 65z';

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
  }

  ${followingTimelineSelector} [${hiddenAttribute}] {
    content: linear-gradient(transparent, transparent);
    height: 0;
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

const processNotifications = (notificationElements) => {
  notificationElements.forEach(async notificationElement => {
    const notification = await notificationObject(notificationElement);
    if (notification) {
      const { mutuals } = notification;
      if (mutuals) {
        notificationElement.dataset.mutuals = mutuals;
      }
    }
  });
};

const alreadyProcessed = postElement =>
  postElement.classList.contains(mutualsClass) &&
  postElement.querySelector(`.${mutualIconClass}`);

const addIcons = function (postElements) {
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

const createIcon = (blogName, color = 'rgb(var(--black))') => {
  const today = new Date();
  const aprilFools = (today.getMonth() === 3 && today.getDate() === 1);

  const icon = dom('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    class: mutualIconClass,
    viewBox: '0 0 1000 1000',
    fill: aprilFools ? '#00b8ff' : color
  }, null, [
    dom('title', { xmlns: 'http://www.w3.org/2000/svg' }, null, [
      translate('{{blogNameLink /}} follows you!').replace('{{blogNameLink /}}', blogName)
    ]),
    dom('path', { xmlns: 'http://www.w3.org/2000/svg', d: aprilFools ? aprilFoolsPath : regularPath })
  ]);
  return icon;
};

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
};
