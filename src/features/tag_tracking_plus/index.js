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

const excludeClass = 'xkit-tag-tracking-plus-done';
const includeFiltered = true;

let trackedTags;
const unreadCounts = new Map();

let sidebarItem;

const refreshCount = async function (tag) {
  if (!trackedTags.includes(tag)) return;

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

  const unreadCountElement = sidebarItem.querySelector(`[data-count-for="#${tag}"]`);

  unreadCountElement.textContent = unreadCountString;
  if (unreadCountElement.closest('li')) {
    unreadCountElement.closest('li').dataset.new = unreadCountString !== '0';
  }

  unreadCounts.set(tag, unreadCountString);
  updateSidebarStatus();
};

const updateSidebarStatus = () => {
  if (sidebarItem) {
    sidebarItem.dataset.loading = [...unreadCounts.values()].some(
      unreadCountString => unreadCountString === undefined,
    );
    sidebarItem.dataset.hasNew = [...unreadCounts.values()].some(
      unreadCountString => unreadCountString && unreadCountString !== '0',
    );
  }
};

let currentRefreshLoop;
const startRefreshLoop = async () => {
  const thisRefreshLoop = Symbol('loop identifier');
  currentRefreshLoop = thisRefreshLoop;

  for (const tag of trackedTags) {
    if (currentRefreshLoop !== thisRefreshLoop) return;
    await refreshCount(tag);
  }
  while (true) {
    for (const tag of trackedTags) {
      if (currentRefreshLoop !== thisRefreshLoop) return;
      await Promise.all([
        refreshCount(tag),
        new Promise(resolve => setTimeout(resolve, 30000)),
      ]);
    }
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
    'tag_tracking_plus.preferences.onlyShowNew': onlyShowNewChanges,
  } = changes;

  if (timestampsChanges) {
    timestamps = timestampsChanges.newValue;
  }
  if (onlyShowNewChanges) {
    sidebarItem.dataset.onlyShowNew = onlyShowNewChanges.newValue;
  }
};

export const main = async function () {
  const trackedTagsData = (await apiFetch('/v2/user/tags')) ?? {};
  trackedTags = trackedTagsData.response?.tags?.map(({ name }) => name) ?? [];

  trackedTags.forEach(tag => unreadCounts.set(tag, undefined));

  ({ [timestampsStorageKey]: timestamps = {} } = await browser.storage.local.get(timestampsStorageKey));

  const { onlyShowNew } = await getPreferences('tag_tracking_plus');

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

  sidebarItem.dataset.onlyShowNew = onlyShowNew;
  updateSidebarStatus();

  onNewPosts.addListener(processPosts);
  startRefreshLoop();
};

export const clean = async function () {
  stopRefreshLoop();
  onNewPosts.removeListener(processPosts);

  removeSidebarItem('tag-tracking-plus');

  unreadCounts.clear();
};

export const stylesheet = true;
