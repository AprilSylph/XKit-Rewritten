import { buildStyle, filterPostElements } from '../util/interface.js';
import { timelineObject } from '../util/react_props.js';
import { apiFetch } from '../util/tumblr_helpers.js';
import { primaryBlogName } from '../util/user.js';
import { keyToCss } from '../util/css_map.js';
import { onNewPosts, pageModifications } from '../util/mutations.js';
import { dom } from '../util/dom.js';
import { getPreferences } from '../util/preferences.js';
import { translate } from '../util/language_data.js';

const mutualIconClass = 'xkit-mutual-icon';
const hiddenClass = 'xkit-mutual-checker-hidden';
const mutualsClass = 'from-mutual';
const postAttributionSelector = keyToCss('postAttribution');

const regularPath = 'M593 500q0-45-22.5-64.5T500 416t-66.5 19-18.5 65 18.5 64.5T500 583t70.5-19 22.5-64zm-90 167q-44 0-83.5 18.5t-63 51T333 808v25h334v-25q0-39-22-71.5t-59.5-51T503 667zM166 168l14-90h558l12-78H180q-8 0-51 63l-42 63v209q-19 3-52 3t-33-3q-1 1 0 27 3 53 0 53l32-2q35-1 53 2v258H2l-3 40q-2 41 3 41 42 0 64-1 7-1 21 1v246h756q25 0 42-13 14-10 22-27 5-13 8-28l1-13V275q0-47-3-63-5-24-22.5-34T832 168H166zm667 752H167V754q17 0 38.5-6.5T241 730q16-12 16-26 0-21-33-28-19-4-57-4-3 0-1-51 2-37 1-36V421q88 0 90-48 1-20-33-30-24-6-57-6-4 0-2-44l2-43h635q14 0 22.5 11t8.5 26v543q0 5 4 26 5 30 5 42 1 22-9 22z';
const aprilFoolsPath = 'M858 352q-6-14-8-35-2-12-4-38-3-38-6-54-7-28-22-43t-43-22q-16-3-54-6-26-2-38-4-21-2-34.5-8T619 124q-9-7-28-24-29-25-44-34-24-16-47-16t-47 16q-15 9-44 34-19 17-28 24-16 12-29.5 18t-34.5 8q-12 2-38 4-38 3-54 6-28 7-43 22t-22 43q-3 16-6 54-2 26-4 38-2 21-8 34.5T124 381q-7 9-24 28-25 29-34 44-16 24-16 47t16 47q9 15 34 44 17 19 24 28 12 16 18 29.5t8 34.5q2 12 4 38 3 38 6 54 7 28 22 43t43 22q16 3 54 6 26 2 38 4 21 2 34.5 8t29.5 18q9 7 28 24 29 25 44 34 24 16 47 16t47-16q15-9 44-34 19-17 28-24 16-12 29.5-18t34.5-8q12-2 38-4 38-3 54-6 28-7 43-22t22-43q3-16 6-54 2-26 4-38 2-21 8-34.5t18-29.5q7-9 24-28 25-29 34-44 16-24 16-47t-16-47q-9-15-34-44-17-19-24-28-12-16-18-29zm-119 62L550 706q-10 17-26.5 27T488 745l-11 1q-34 0-59-24L271 584q-26-25-27-60.5t23.5-61.5 60.5-27.5 62 23.5l71 67 132-204q20-30 55-38t65 11.5 37.5 54.5-11.5 65z';

const following = {};
const followingYou = {};

let showOnlyMutuals;
let aprilFools;

const styleElement = buildStyle(`
  svg.xkit-mutual-icon {
    vertical-align: text-bottom;

    height: 1.23em;
    margin-top: 0;
    margin-left: 0;
    margin-right: 0.5ch;
  }

  [data-timeline="/v2/timeline/dashboard"] .xkit-mutual-checker-hidden article {
    display: none;
  }

  ${keyToCss('blogCardBlogLink')} {
    display: flex;
    align-items: end;
  }

  ${keyToCss('blogCardBlogLink')} svg.xkit-mutual-icon {
    height: 1.4em;
  }
`);

const createIcon = blogName => dom('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  class: mutualIconClass,
  viewBox: '0 0 1000 1000',
  fill: aprilFools ? '#00b8ff' : 'rgb(var(--black))'
}, null, [
  dom('title', { xmlns: 'http://www.w3.org/2000/svg' }, null, [
    translate('{{blogNameLink /}} follows you!').replace('{{blogNameLink /}}', blogName)
  ]),
  dom('path', { xmlns: 'http://www.w3.org/2000/svg', d: aprilFools ? aprilFoolsPath : regularPath })
]);

const alreadyProcessed = postElement =>
  postElement.classList.contains(mutualsClass) &&
  postElement.querySelector(`.${mutualIconClass}`);

const processPosts = function (postElements) {
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    if (alreadyProcessed(postElement)) return;

    const postAttribution = postElement.querySelector(postAttributionSelector);
    if (postAttribution === null) { return; }

    const blogLink = postAttribution.querySelector('a');
    const blogName = blogLink?.textContent;
    if (!blogName) return;

    const followingBlog = await getIsFollowing(blogName, postElement);
    if (!followingBlog) { return; }

    const isMutual = await getIsFollowingYou(blogName);
    if (isMutual) {
      postElement.classList.add(mutualsClass);
      postAttribution.prepend(createIcon(blogName));
    } else if (showOnlyMutuals) {
      postElement.classList.add(hiddenClass);
    }
  });
};

const processBlogCardLinks = blogCardLinks =>
  blogCardLinks.forEach(async blogCardLink => {
    const blogName = blogCardLink.querySelector(keyToCss('blogLinkShort'))?.textContent || blogCardLink?.textContent;
    if (!blogName) return;

    const followingBlog = await getIsFollowing(blogName, blogCardLink);
    if (!followingBlog) return;

    const isMutual = await getIsFollowingYou(blogName);
    if (isMutual) {
      const icon = createIcon(blogName);
      !aprilFools && icon.setAttribute('fill', blogCardLink.style.color);
      blogCardLink.before(icon);
    }
  });

const getIsFollowing = async (blogName, element) => {
  const { blog } = await timelineObject(element) ?? {};

  if (following[blogName] === undefined) {
    if (blogName === blog?.name) {
      following[blogName] = Promise.resolve(blog.followed && !blog.isMember);
    } else {
      following[blogName] = apiFetch(`/v2/blog/${blogName}/info`)
        .then(({ response: { blog: { followed } } }) => followed)
        .catch(() => Promise.resolve(false));
    }
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

  ({ showOnlyMutuals } = await getPreferences('mutual_checker'));
  following[primaryBlogName] = Promise.resolve(false);

  const today = new Date();
  aprilFools = (today.getMonth() === 3 && today.getDate() === 1);

  onNewPosts.addListener(processPosts);
  pageModifications.register(`${keyToCss('blogCard')} ${keyToCss('blogCardBlogLink')} > a`, processBlogCardLinks);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  pageModifications.unregister(processBlogCardLinks);
  styleElement.remove();

  $(`.${mutualsClass}`).removeClass(mutualsClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  $(`.${mutualIconClass}`).remove();
};
