import { filterPostElements } from '../util/interface.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';

const excludeClass = 'xkit-seen-posts-done';
const timeline = /\/v2\/timeline\/dashboard/;
const includeFiltered = true;

const dimClass = 'xkit-seen-posts-seen';
const onlyDimAvatarsClass = 'xkit-seen-posts-only-dim-avatar';
const hideClass = 'xkit-seen-posts-hide';

const storageKey = 'seen_posts.seenPosts';
let seenPosts = [];

const dimPosts = function (postElements) {
  for (const postElement of filterPostElements(postElements, { excludeClass, timeline, includeFiltered })) {
    const { id } = postElement.dataset;

    if (seenPosts.includes(id)) {
      postElement.classList.add(dimClass);
    } else {
      seenPosts.push(id);
    }
  }

  seenPosts.splice(0, seenPosts.length - 10000);

  browser.storage.local.set({ [storageKey]: seenPosts });
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
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hideClass}`).removeClass(hideClass);
  $(`.${dimClass}`).removeClass(dimClass);
  $(`.${onlyDimAvatarsClass}`).removeClass(onlyDimAvatarsClass);
};

export const stylesheet = true;
