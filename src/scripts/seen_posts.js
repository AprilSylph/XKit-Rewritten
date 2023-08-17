import { filterPostElements, postSelector } from '../util/interface.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';

const excludeClass = 'xkit-seen-posts-done';
const timeline = '/v2/timeline/dashboard';
const includeFiltered = true;

const dimClass = 'xkit-seen-posts-seen';
const onlyDimAvatarsClass = 'xkit-seen-posts-only-dim-avatar';
const hideClass = 'xkit-seen-posts-hide';
const lengthenedClass = 'xkit-seen-posts-lengthened';

const storageKey = 'seen_posts.seenPosts';
let seenPosts = [];

/** @type {Map<Element, ?number>} */
const timers = new Map();

const observer = new IntersectionObserver(
  (entries) => entries.forEach(({ isIntersecting, target: articleElement }) => {
    if (isIntersecting) {
      if (!timers.has(articleElement)) {
        timers.set(articleElement, setTimeout(() => markAsSeen(articleElement), 300));
      }
    } else {
      clearTimeout(timers.get(articleElement));
      timers.delete(articleElement);
    }
  }),
  { rootMargin: '-20px 0px' }
);

const markAsSeen = (articleElement) => {
  observer.unobserve(articleElement);
  timers.delete(articleElement);

  const postElement = articleElement.closest(postSelector);
  seenPosts.push(postElement.dataset.id);
  seenPosts.splice(0, seenPosts.length - 10000);
  browser.storage.local.set({ [storageKey]: seenPosts });
};

const lengthenTimelines = () =>
  [...document.querySelectorAll(`[data-timeline="${timeline}"]`)].forEach(timelineElement => {
    if (!timelineElement.querySelector(keyToCss('manualPaginatorButtons'))) {
      timelineElement.classList.add(lengthenedClass);
    }
  });

const dimPosts = function (postElements) {
  lengthenTimelines();

  for (const postElement of filterPostElements(postElements, { excludeClass, timeline, includeFiltered })) {
    const { id } = postElement.dataset;

    if (seenPosts.includes(id)) {
      postElement.classList.add(dimClass);
    } else {
      observer.observe(postElement.querySelector('article'));
    }
  }
};

export const onStorageChanged = async function (changes, areaName) {
  const {
    'seen_posts.preferences.hideSeenPosts': hideSeenPostsChanges,
    'seen_posts.preferences.onlyDimAvatars': onlyDimAvatarsChanges,
    [storageKey]: seenPostsChanges
  } = changes;

  if (hideSeenPostsChanges && hideSeenPostsChanges.oldValue !== undefined) {
    const { newValue: hideSeenPosts } = hideSeenPostsChanges;
    const addOrRemoveHide = hideSeenPosts ? 'add' : 'remove';
    document.body.classList[addOrRemoveHide](hideClass);
  }

  if (onlyDimAvatarsChanges && onlyDimAvatarsChanges.oldValue !== undefined) {
    const { newValue: onlyDimAvatars } = onlyDimAvatarsChanges;
    const addOrRemove = onlyDimAvatars ? 'add' : 'remove';
    document.body.classList[addOrRemove](onlyDimAvatarsClass);
  }

  if (seenPostsChanges) {
    ({ newValue: seenPosts } = seenPostsChanges);
  }
};

export const main = async function () {
  ({ [storageKey]: seenPosts = [] } = await browser.storage.local.get(storageKey));

  const { hideSeenPosts, onlyDimAvatars } = await getPreferences('seen_posts');
  if (hideSeenPosts) {
    document.body.classList.add(hideClass);
  }
  if (onlyDimAvatars) {
    document.body.classList.add(onlyDimAvatarsClass);
  }

  onNewPosts.addListener(dimPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(dimPosts);

  observer.disconnect();
  timers.forEach((timerId) => clearTimeout(timerId));
  timers.clear();

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hideClass}`).removeClass(hideClass);
  $(`.${dimClass}`).removeClass(dimClass);
  $(`.${onlyDimAvatarsClass}`).removeClass(onlyDimAvatarsClass);
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
};

export const stylesheet = true;
