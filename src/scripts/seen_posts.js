import { filterPostElements } from '../util/interface.js';
import { exposeTimelines } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';

const excludeClass = 'xkit-seen-posts-done';
const timeline = /\/v2\/timeline\/dashboard/;
const includeFiltered = true;

const dimClass = 'xkit-seen-posts-seen';
const onlyDimAvatarsClass = 'xkit-seen-posts-only-dim-avatar';

let seenPosts = [];

const dimPosts = async function (elements) {
  await exposeTimelines();
  const postElements = filterPostElements(elements, { excludeClass, timeline, includeFiltered });

  for (const postElement of postElements) {
    const { id } = postElement.dataset;

    if (seenPosts.includes(id)) {
      postElement.classList.add(dimClass);
    }
  }

  const storageKey = 'seen_posts.seenPosts';
  ({ [storageKey]: seenPosts = [] } = await browser.storage.local.get(storageKey));

  for (const postElement of postElements) {
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
  const { 'seen_posts.preferences.onlyDimAvatars': onlyDimAvatarsChanges } = changes;

  if (onlyDimAvatarsChanges && onlyDimAvatarsChanges.oldValue !== undefined) {
    const { newValue: onlyDimAvatars } = onlyDimAvatarsChanges;
    const addOrRemove = onlyDimAvatars ? 'add' : 'remove';
    document.body.classList[addOrRemove](onlyDimAvatarsClass);
  }
};

export const main = async function () {
  const { onlyDimAvatars } = await getPreferences('seen_posts');
  if (onlyDimAvatars) {
    document.body.classList.add(onlyDimAvatarsClass);
  }

  onNewPosts.addListener(dimPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(dimPosts);
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${dimClass}`).removeClass(dimClass);
  $(`.${onlyDimAvatarsClass}`).removeClass(onlyDimAvatarsClass);
};

export const stylesheet = true;
