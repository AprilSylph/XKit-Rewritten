import { apiFetch, onClickNavigate } from '../util/tumblr_helpers.js';
import { filterPostElements } from '../util/interface.js';
import { timelineObject } from '../util/react_props.js';
import { keyToCss } from '../util/css_map.js';
import { onNewPosts, pageModifications } from '../util/mutations.js';
import { dom } from '../util/dom.js';
import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { getPreferences } from '../util/preferences.js';

const storageKey = 'tag_tracking_plus.trackedTagTimestamps';

const excludeClass = 'xkit-tag-tracking-plus-done';
const includeFiltered = true;

const tagLinkSelector = `${keyToCss('searchResult')} h3 ~ a${keyToCss('typeaheadRow')}[href^="/tagged/"]`;
const tagTextSelector = keyToCss('tagText');

const trackedTagsData = await apiFetch('/v2/user/tags') ?? {};
const trackedTags = trackedTagsData.response?.tags?.map(({ name }) => name) ?? [];
const unreadCounts = new Map();

let sidebarItem;

const refreshCount = async function (tag) {
  if (!trackedTags.includes(tag)) return;

  const { [storageKey]: timestamps = {} } = await browser.storage.local.get(storageKey);
  const savedTimestamp = timestamps[tag] ?? 0;
  const {
    response: {
      timeline: {
        elements = [],
        links
      }
    }
  } = await apiFetch(
    `/v2/hubs/${encodeURIComponent(tag)}/timeline`,
    { queryParams: { limit: 20, sort: 'recent' } }
  );

  const posts = elements.filter(({ objectType, displayType, recommendedSource }) =>
    objectType === 'post' &&
    displayType === undefined &&
    recommendedSource === null
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
  const unreadCountString = `${unreadCount}${showPlus ? '+' : ''}`;

  [document, ...(!sidebarItem || document.contains(sidebarItem) ? [] : [sidebarItem])]
    .flatMap(node => [...node.querySelectorAll(`[data-count-for="#${tag}"]`)])
    .filter((value, index, array) => array.indexOf(value) === index)
    .forEach(unreadCountElement => {
      unreadCountElement.textContent = unreadCountString;
    });

  unreadCounts.set(tag, unreadCountString);
};

const refreshAllCounts = async (isFirstRun = false) => {
  for (const tag of trackedTags) {
    await Promise.all([
      refreshCount(tag),
      new Promise(resolve => setTimeout(resolve, isFirstRun ? 0 : 30000))
    ]);
  }
};

let intervalID = 0;
const startRefreshInterval = () => { intervalID = setInterval(refreshAllCounts, 30000 * trackedTags.length); };
const stopRefreshInterval = () => clearInterval(intervalID);

const processPosts = async function (postElements) {
  const { pathname, searchParams } = new URL(location);
  if (!pathname.startsWith('/tagged/') || searchParams.get('sort') === 'top') {
    return;
  }

  const encodedCurrentTag = pathname.split('/')[2];
  const currentTag = decodeURIComponent(encodedCurrentTag);
  if (!trackedTags.includes(currentTag)) return;

  const { [storageKey]: timestamps = {} } = await browser.storage.local.get(storageKey);
  const timeline = new RegExp(`/v2/hubs/${encodedCurrentTag}/timeline`);

  let updated = false;

  for (const postElement of filterPostElements(postElements, { excludeClass, timeline, includeFiltered })) {
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
    await browser.storage.local.set({ [storageKey]: timestamps });
    refreshCount(currentTag);
  }
};

const processTagLinks = function (tagLinkElements) {
  tagLinkElements.forEach(tagLinkElement => {
    if (tagLinkElement.querySelector('[data-count-for]') !== null) return;

    const tagTextElement = tagLinkElement.querySelector(tagTextSelector);
    const tag = tagTextElement.textContent;
    const unreadCountElement = dom(
      'span',
      {
        'data-count-for': `#${tag}`,
        style: 'margin-left: auto; margin-right: 1ch; opacity: 0.65;'
      },
      null,
      unreadCounts.get(tag) ?? '\u22EF'
    );

    tagTextElement.after(unreadCountElement);
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
  refreshAllCounts(true).then(startRefreshInterval);

  const { showUnread } = await getPreferences('tag_tracking_plus');
  if (showUnread === 'both' || showUnread === 'search') {
    pageModifications.register(tagLinkSelector, processTagLinks);
  }
  if (showUnread === 'both' || showUnread === 'sidebar') {
    sidebarItem = addSidebarItem({
      id: 'tag-tracking-plus',
      title: 'Tag Tracking+',
      rows: trackedTags.map(tag => ({
        label: `#${tag}`,
        href: `/tagged/${encodeURIComponent(tag)}?sort=recent`,
        onclick: onClickNavigate,
        count: '\u22EF'
      }))
    });
  }

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  stopRefreshInterval();
  onNewPosts.removeListener(processPosts);
  pageModifications.unregister(processTagLinks);

  removeSidebarItem('tag-tracking-plus');
  $(`${tagLinkSelector} [data-count-for]`).remove();

  unreadCounts.clear();
  sidebarItem = undefined;
};
