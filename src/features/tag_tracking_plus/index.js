import { filterPostElements } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';
import { timelineObject } from '../../utils/react_props.js';
import { addSidebarItem, removeSidebarItem } from '../../utils/sidebar.js';
import { tagTimelineFilter } from '../../utils/timeline_id.js';
import { apiFetch, onClickNavigate } from '../../utils/tumblr_helpers.js';

const timestampsStorageKey = 'tag_tracking_plus.trackedTagTimestamps';
/** @type {Record<string, number>} */
let timestamps;

const unreadCountsStorageKey = '_caches.tag_tracking_plus.unreadCounts';
/** @type {Record<string, { unreadCountString: string, updated: number }>} */
let unreadCounts;

const excludeClass = 'xkit-tag-tracking-plus-done';
const includeFiltered = true;

let trackedTags = [];
let trackedTagsString;

let sidebarItem;

const BACKGROUND_REFRESH_INTERVAL = 10_000; // Minimum time between background refresh fetches (of any tag).
const PER_TAG_BACKGROUND_REFRESH_INTERVAL = 120_000; // Minimum time between background refresh fetches of a specific tag.
const INTIIAL_LOAD_INTERVAL = 500; // Minimum time between initial load fetches.

const INITIAL_LOAD_STORED_COUNT_MAX_AGE = 30_000; // During initial load (i.e. reloading the page), load stored counts up to this age instead of fetching.

const countIsStale = (tag, ttl) => unreadCounts[tag] && Date.now() - unreadCounts[tag].updated > ttl;

// If multiple browser tabs are currently refreshing the same set of tracked tag(s), only allow one to refresh.
let lastRefreshInAnotherTab = 0;
const otherTabRefreshChannel = new BroadcastChannel('xkit-tag-tracking-plus-refresh-sync');
otherTabRefreshChannel.addEventListener('message', event => {
  if (event.data.trackedTagsString === trackedTagsString) {
    lastRefreshInAnotherTab = Date.now();
  }
});
const thisTabShouldRefresh = interval => {
  const timeSinceRefresh = Date.now() - lastRefreshInAnotherTab;
  if (timeSinceRefresh < interval * 1.5) {
    console.info(`Tag Tracking+: skipping refresh; another tab refreshed ${timeSinceRefresh}ms ago`);
    return false;
  }
  otherTabRefreshChannel.postMessage({ trackedTagsString });
  return true;
};

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

  unreadCounts[tag] = { unreadCountString, updated: Date.now() };
  await browser.storage.local.set({ [unreadCountsStorageKey]: unreadCounts });
};

const updateSidebar = () => {
  const loadedTrackedTags = trackedTags.filter(tag => unreadCounts[tag]);
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
  const nonLoadedTag = trackedTags.find(tag => !unreadCounts[tag]);
  const erroredTag = trackedTags.find(tag => unreadCounts[tag]?.unreadCountString === '⚠️');

  if (nonLoadedTag) {
    await refreshCount(nonLoadedTag);
  } else if (erroredTag) {
    await refreshCount(erroredTag);
  } else {
    const oldestTag = [...trackedTags]
      .sort((a, b) => unreadCounts[a].updated - unreadCounts[b].updated)
      .at(0);
    if (countIsStale(oldestTag, PER_TAG_BACKGROUND_REFRESH_INTERVAL)) {
      await refreshCount(oldestTag);
    } else {
      console.info(`Tag Tracking+: no need to refresh; oldest tag ${oldestTag} is fresh!`);
    }
  }
};

let currentRefreshLoop;
const startRefreshLoop = async () => {
  const thisRefreshLoop = Date.now();
  currentRefreshLoop = thisRefreshLoop;

  // eslint-disable-next-line no-unmodified-loop-condition
  while (currentRefreshLoop === thisRefreshLoop) {
    const interval = trackedTags.every(tag => unreadCounts[tag])
      ? BACKGROUND_REFRESH_INTERVAL
      : INTIIAL_LOAD_INTERVAL;

    await Promise.all([
      thisTabShouldRefresh(interval) && refreshNextCount(),
      new Promise(resolve => setTimeout(resolve, interval)),
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
  trackedTagsString = JSON.stringify(trackedTags);

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
  await browser.storage.local.set({ [unreadCountsStorageKey]: unreadCounts });

  onNewPosts.addListener(processPosts);
  startRefreshLoop();
};

export const clean = async function () {
  stopRefreshLoop();
  onNewPosts.removeListener(processPosts);

  removeSidebarItem('tag-tracking-plus');

  trackedTags = [];
  trackedTagsString = undefined;
  lastRefreshInAnotherTab = 0;
};

export const stylesheet = true;
