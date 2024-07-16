import { filterPostElements, getPostElements, getTimelineItemWrapper, postSelector } from '../utils/interface.js';
import { getPreferences } from '../utils/preferences.js';
import { onNewPosts, pageModifications } from '../utils/mutations.js';
import { keyToCss } from '../utils/css_map.js';
import { followingTimelineFilter, followingTimelineSelector, timelineSelector } from '../utils/timeline_id.js';

const excludeAttribute = 'data-seen-posts-done';
const timeline = followingTimelineFilter;
const includeFiltered = true;

const dimAttribute = 'data-seen-posts-seen';
const onlyDimAvatarsClass = 'xkit-seen-posts-only-dim-avatar';
const hideClass = 'xkit-seen-posts-hide';
const lengthenedClass = 'xkit-seen-posts-lengthened';

const softRefreshLoaderSelector = `${followingTimelineSelector} ${keyToCss('container')}:has(+ ${keyToCss('scrollContainer')}) > ${keyToCss('knightRiderLoader')}`;

const storageKey = 'seen_posts.seenPosts';
let seenPosts = [];

/** @type {Map<Element, ?number>} */
const timers = new Map();

const observer = new IntersectionObserver(
  (entries) => entries.forEach(({ isIntersecting, target: element }) => {
    if (isIntersecting) {
      if (!timers.has(element)) {
        timers.set(element, setTimeout(() => markAsSeen(element), 300));
      }
    } else {
      clearTimeout(timers.get(element));
      timers.delete(element);
    }
  }),
  { rootMargin: '-20px 0px' }
);

const markAsSeen = (element) => {
  observer.unobserve(element);
  timers.delete(element);

  const { dataset: { id } } = element.closest(postSelector);
  if (seenPosts.includes(id)) return;

  seenPosts.push(id);
  seenPosts.splice(0, seenPosts.length - 10000);
  browser.storage.local.set({ [storageKey]: seenPosts });
};

const lengthenTimelines = () =>
  [...document.querySelectorAll(followingTimelineSelector)].forEach(timelineElement => {
    if (!timelineElement.querySelector(keyToCss('manualPaginatorButtons'))) {
      timelineElement.classList.add(lengthenedClass);
    }
  });

const dimPosts = function (postElements) {
  lengthenTimelines();

  for (const postElement of filterPostElements(postElements, { timeline, includeFiltered })) {
    const { id } = postElement.dataset;
    const timelineItem = getTimelineItemWrapper(postElement);

    const isFirstRender = timelineItem.getAttribute(excludeAttribute) === null;
    timelineItem.setAttribute(excludeAttribute, '');

    if (seenPosts.includes(id) === false) {
      observer.observe(postElement.querySelector('article header + *'));
    } else if (isFirstRender) {
      timelineItem.setAttribute(dimAttribute, '');
    }
  }
};

const onSoftRefresh = loaderElements => {
  const refreshedTimelineElements = loaderElements.map(element => element.closest(timelineSelector));
  const refreshedPostElements = getPostElements({ timeline: element => refreshedTimelineElements.includes(element), includeFiltered });

  for (const postElement of refreshedPostElements) {
    const { id } = postElement.dataset;
    const timelineItem = getTimelineItemWrapper(postElement);

    if (seenPosts.includes(id)) {
      timelineItem.setAttribute(dimAttribute, '');
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
  pageModifications.register(softRefreshLoaderSelector, onSoftRefresh);
};

export const clean = async function () {
  onNewPosts.removeListener(dimPosts);
  pageModifications.unregister(onSoftRefresh);

  observer.disconnect();
  timers.forEach((timerId) => clearTimeout(timerId));
  timers.clear();

  $(`[${excludeAttribute}]`).removeAttr(excludeAttribute);
  $(`[${dimAttribute}]`).removeAttr(dimAttribute);
  $(`.${hideClass}`).removeClass(hideClass);
  $(`.${onlyDimAvatarsClass}`).removeClass(onlyDimAvatarsClass);
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
};

export const stylesheet = true;
