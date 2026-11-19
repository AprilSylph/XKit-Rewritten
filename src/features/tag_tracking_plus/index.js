import { filterPostElements } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';
import { createRateLimitFunction } from '../../utils/rate_limit.js';
import { timelineObject } from '../../utils/react_props.js';
import { addSidebarItem, removeSidebarItem } from '../../utils/sidebar.js';
import { tagTimelineFilter } from '../../utils/timeline_id.js';
import { apiFetch, onClickNavigate } from '../../utils/tumblr_helpers.js';

const timestampsStorageKey = 'tag_tracking_plus.trackedTagTimestamps';
/** @type {Record<string, number>} */
let timestamps;

/**
 * @typedef {object} UnreadCount
 * @property {string} unreadCountString String representing a tag's unread post count.
 * @property {number} updated Unix time value of the last time this entry was fetched.
 * @property {boolean} loaded If `false`, this stored value is not used to render the sidebar yet. Used to create a visually consistent "waterfall" sidebar load sequence even when using some cached data.
 */

const unreadCountsStorageKey = 'caches.tag_tracking_plus.unreadCounts';
/** @type {Record<string, UnreadCount>} */
let unreadCounts;

const excludeClass = 'xkit-tag-tracking-plus-done';
const includeFiltered = true;

let trackedTags;

let sidebarItem;

const INTERVAL = 500; // Minimum time between count refresh fetches.
const INTERVAL_BACKGROUND = 10_000; // Minimum time between background count refresh fetches (of any tag).
const INTERVAL_PER_TAG = 120_000; // Minimum time between background count refresh fetches of a specific tag.

const INITIAL_LOAD_STORED_COUNT_MAX_AGE = 30_000; // During initial load (i.e. reloading the page), load stored counts up to this age instead of fetching.

const countIsStale = (tag, ttl) => unreadCounts[tag] && Date.now() - unreadCounts[tag].updated > ttl;

let shouldRefresh;

const refreshCount = async function (tag) {
  if (!trackedTags.includes(tag)) return;

  console.info(`Tag Tracking+: REFRESHING ${tag}`);

  let unreadCountString = '⚠️';

  try {
    const savedTimestamp = timestamps[tag] ?? 0;
    const {
      response: {
        timeline: {
          elements = [],
          links,
        },
      },
    } = await apiFetch(
      `/v2/hubs/${encodeURIComponent(tag)}/timeline`,
      { queryParams: { limit: 20, sort: 'recent' } },
    );

    const posts = elements.filter(({ objectType, displayType, recommendedSource }) =>
      objectType === 'post' &&
      displayType === undefined &&
      recommendedSource === null,
    );

    let unreadCount = 0;

    for (const { timestamp } of posts) {
      if (timestamp <= savedTimestamp) {
        break;
      } else {
        unreadCount++;
      }
    }

    const showPlus = unreadCount === posts.length && links?.next;
    unreadCountString = `${unreadCount}${showPlus ? '+' : ''}`;
  } catch (exception) {
    console.error(exception);
  }

  unreadCounts[tag] = { unreadCountString, updated: Date.now(), loaded: true };
  await browser.storage.local.set({ [unreadCountsStorageKey]: unreadCounts });
};

const loadStoredCount = async tag => {
  console.info(`Tag Tracking+: loading ${tag} from storage!`);
  unreadCounts[tag].loaded = true;
  await browser.storage.local.set({ [unreadCountsStorageKey]: unreadCounts });
};

const updateSidebar = () => {
  const loadedTrackedTags = trackedTags.filter(tag => unreadCounts[tag]?.loaded);
  loadedTrackedTags.forEach(tag => {
    const { unreadCountString } = unreadCounts[tag];
    const unreadCountElement = sidebarItem.querySelector(`[data-count-for="#${tag}"]`);
    unreadCountElement.textContent = unreadCountString;
    if (unreadCountElement.closest('li')) {
      unreadCountElement.closest('li').dataset.new = unreadCountString !== '0';
    }
  });
  if (loadedTrackedTags.length === trackedTags.length) {
    sidebarItem.dataset.loading = false;
  }
  sidebarItem.dataset.hasNew = loadedTrackedTags.some(tag => unreadCounts[tag].unreadCountString !== '0');
};

const refreshNextCount = async () => {
  const nonLoadedTag = trackedTags.find(tag => !unreadCounts[tag]?.loaded);
  const erroredTag = trackedTags.find(tag => unreadCounts[tag]?.unreadCountString === '⚠️');

  if (nonLoadedTag) {
    unreadCounts[nonLoadedTag]
      ? await loadStoredCount(nonLoadedTag)
      : await refreshCount(nonLoadedTag);
  } else if (erroredTag) {
    await refreshCount(erroredTag);
  } else {
    const oldestTag = [...trackedTags]
      .sort((a, b) => unreadCounts[a].updated - unreadCounts[b].updated)
      .at(0);
    if (countIsStale(oldestTag, INTERVAL_PER_TAG)) {
      await refreshCount(oldestTag);
    } else {
      console.info(`Tag Tracking+: no need to refresh; oldest tag ${oldestTag} is fresh!`);
    }
  }
};

let currentRefreshLoop;
const startRefreshLoop = async () => {
  const thisRefreshLoop = Symbol('loop identifier');
  currentRefreshLoop = thisRefreshLoop;

  // eslint-disable-next-line no-unmodified-loop-condition
  while (currentRefreshLoop === thisRefreshLoop) {
    const fullyLoaded = trackedTags.every(tag => unreadCounts[tag]?.loaded);
    await Promise.all([
      shouldRefresh(fullyLoaded ? INTERVAL_BACKGROUND : INTERVAL) && refreshNextCount(),
      new Promise(resolve => setTimeout(resolve, INTERVAL)),
    ]);
  }
};
const stopRefreshLoop = () => { currentRefreshLoop = undefined; };

const processPosts = async function (postElements) {
  const { pathname, searchParams } = new URL(location);
  if (!pathname.startsWith('/tagged/') || searchParams.get('sort') === 'top') {
    return;
  }

  const encodedCurrentTag = pathname.split('/')[2];
  const currentTag = decodeURIComponent(encodedCurrentTag);
  if (!trackedTags.includes(currentTag)) return;

  const timeline = tagTimelineFilter(currentTag);

  let updated = false;

  for (const postElement of filterPostElements(postElements, { excludeClass, timeline, includeFiltered })) {
    // see https://github.com/AprilSylph/XKit-Rewritten/issues/1666
    if (!postElement.isConnected) continue;

    const { tags, timestamp } = await timelineObject(postElement);

    if (tags.every(tag => tag.toLowerCase() !== currentTag.toLowerCase())) {
      continue;
    }

    const savedTimestamp = timestamps[currentTag] || 0;
    if (timestamp > savedTimestamp) {
      timestamps[currentTag] = timestamp;
      updated = true;
    }
  }

  if (updated) {
    await browser.storage.local.set({ [timestampsStorageKey]: timestamps });
    refreshCount(currentTag);
  }
};

export const onStorageChanged = async (changes) => {
  const {
    [timestampsStorageKey]: timestampsChanges,
    [unreadCountsStorageKey]: unreadCountsChanges,
    'tag_tracking_plus.preferences.onlyShowNew': onlyShowNewChanges,
  } = changes;

  if (timestampsChanges) {
    timestamps = timestampsChanges.newValue;
  }
  if (unreadCountsChanges) {
    unreadCounts = unreadCountsChanges.newValue;
    updateSidebar();
  }
  if (onlyShowNewChanges) {
    sidebarItem.dataset.onlyShowNew = onlyShowNewChanges.newValue;
  }
};

export const main = async function () {
  const trackedTagsData = (await apiFetch('/v2/user/tags')) ?? {};
  trackedTags = trackedTagsData.response?.tags?.map(({ name }) => name) ?? [];

  sidebarItem = addSidebarItem({
    id: 'tag-tracking-plus',
    title: 'Tag Tracking+',
    rows: trackedTags.map(tag => ({
      label: `#${tag}`,
      href: `/tagged/${encodeURIComponent(tag)}?sort=recent`,
      onclick: onClickNavigate,
      count: '\u22EF',
    })),
  });

  if (!trackedTags.length) return;

  const { onlyShowNew } = await getPreferences('tag_tracking_plus');

  sidebarItem.dataset.onlyShowNew = onlyShowNew;
  sidebarItem.dataset.loading = true;

  ({
    [timestampsStorageKey]: timestamps = {},
    [unreadCountsStorageKey]: unreadCounts = {},
  } = await browser.storage.local.get([timestampsStorageKey, unreadCountsStorageKey]));

  // Discard stale stored counts.
  for (const tag of Object.keys(unreadCounts)) {
    if (countIsStale(tag, INITIAL_LOAD_STORED_COUNT_MAX_AGE)) {
      delete unreadCounts[tag];
    }
  }
  if (onlyShowNew === false) {
    // Mark (fresh) tracked stored counts as not loaded until `loadStoredCount` is called on them.
    // Creates a visually consistent "waterfall" sidebar load sequence.
    for (const tag of Object.keys(unreadCounts)) {
      if (trackedTags.includes(tag)) {
        unreadCounts[tag].loaded = false;
      }
    }
  }
  await browser.storage.local.set({ [unreadCountsStorageKey]: unreadCounts });

  shouldRefresh = createRateLimitFunction({
    id: `tag-tracking-plus-${JSON.stringify(trackedTags)}`,
    multiTab: true,
  });

  onNewPosts.addListener(processPosts);
  startRefreshLoop();
};

export const clean = async function () {
  stopRefreshLoop();
  onNewPosts.removeListener(processPosts);

  removeSidebarItem('tag-tracking-plus');
};

export const stylesheet = true;
