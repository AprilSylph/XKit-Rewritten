import { filterPostElements } from '../util/interface.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';

const excludeClass = 'xkit-seen-posts-done';
const timeline = /\/v2\/timeline\/dashboard/;
const includeFiltered = true;

const dimClass = 'xkit-seen-posts-seen';
const onlyDimAvatarsClass = 'xkit-seen-posts-only-dim-avatar';

const storageKey = 'seen_posts.seenPosts';
let seenPosts = [];

/** @type {Map<IntersectionObserver, ?number>} */
const observersAndTimers = new Map();

const markAsSeen = (postElement, observer) => {
  postElement.style.border = '3px solid blue';

  observer.disconnect();
  observersAndTimers.delete(observer);

  seenPosts.push(postElement.dataset.id);
  seenPosts.splice(0, seenPosts.length - 10000);
  // browser.storage.local.set({ [storageKey]: seenPosts });
};

const observeUntilSeen = postElement => {
  postElement.style.border = '5px dotted orange';

  const observer = new IntersectionObserver(
    (entries, observer) => {
      const isIntersecting = [...entries].every(({ isIntersecting }) => isIntersecting);

      if (isIntersecting) {
        postElement.style.border = '3px solid green';

        observersAndTimers.set(observer, setTimeout(() => markAsSeen(postElement), 300));
      } else {
        clearTimeout(observersAndTimers.get(observer));
      }
    },
    { rootMargin: '-20px 0px' }
  );

  observersAndTimers.set(observer, undefined);
  observer.observe(postElement.querySelector('article'));
};

const dimPosts = function (postElements) {
  for (const postElement of filterPostElements(postElements, { excludeClass, timeline, includeFiltered })) {
    const { id } = postElement.dataset;

    if (seenPosts.includes(id)) {
      postElement.style.border = '3px solid purple';
      postElement.classList.add(dimClass);
    } else {
      observeUntilSeen(postElement);
    }
  }
};

export const onStorageChanged = async function (changes, areaName) {
  const {
    'seen_posts.preferences.onlyDimAvatars': onlyDimAvatarsChanges,
    [storageKey]: seenPostsChanges
  } = changes;

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

  const { onlyDimAvatars } = await getPreferences('seen_posts');
  if (onlyDimAvatars) {
    document.body.classList.add(onlyDimAvatarsClass);
  }

  onNewPosts.addListener(dimPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(dimPosts);

  observersAndTimers.forEach((timerId, observer) => {
    clearTimeout(timerId);
    observer.disconnect();
  });
  observersAndTimers.clear();

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${dimClass}`).removeClass(dimClass);
  $(`.${onlyDimAvatarsClass}`).removeClass(onlyDimAvatarsClass);
};

export const stylesheet = true;
