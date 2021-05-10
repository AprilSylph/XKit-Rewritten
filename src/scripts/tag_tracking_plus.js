import { apiFetch } from '../util/tumblr_helpers.js';
import { getPostElements } from '../util/interface.js';
import { timelineObjectMemoized } from '../util/react_props.js';
import { keyToCss } from '../util/css_map.js';
import { onNewPosts, onBaseContainerMutated } from '../util/mutations.js';
import { translate } from '../util/language_data.js';

const storageKey = 'tag_tracking_plus.trackedTagTimestamps';
const excludeClass = 'xkit-tag-tracking-plus-done';

let searchResultSelector;
let tagTextSelector;
let tagsYouFollowString;

const processPosts = async function () {
  const { searchParams } = new URL(location);
  if (!location.pathname.startsWith('/tagged/') || searchParams.get('sort') === 'top') {
    return;
  }

  const currentTag = decodeURIComponent(location.pathname.split('/')[2].replace(/\+/g, ' '));
  const { response: { following } } = await apiFetch('/v2/user/tags/following', { queryParams: { tag: currentTag } });
  if (!following) { return; }

  const { [storageKey]: timestamps = {} } = await browser.storage.local.get(storageKey);
  for (const postElement of getPostElements({ excludeClass, noPeepr: true, includeFiltered: true })) {
    const { timestamp } = await timelineObjectMemoized(postElement.dataset.id);
    const savedTimestamp = timestamps[currentTag] || 0;

    if (timestamp > savedTimestamp) {
      timestamps[currentTag] = timestamp;
    }
  }
  browser.storage.local.set({ [storageKey]: timestamps });
};

const processTagLinks = async function () {
  const searchResultElement = document.querySelector(searchResultSelector);
  if (!searchResultElement || searchResultElement.classList.contains(excludeClass)) { return; }

  searchResultElement.classList.add(excludeClass);
  const { [storageKey]: timestamps = {} } = await browser.storage.local.get(storageKey);

  const tagsYouFollowHeading = [...searchResultElement.querySelectorAll('h3')].find(h3 => h3.textContent === tagsYouFollowString);
  if (!tagsYouFollowHeading) { return; }
  tagsYouFollowHeading.dataset.followedTags = true;

  const tagLinkElements = searchResultElement.querySelectorAll('[data-followed-tags] ~ [href^="/tagged/"]');
  if (!tagLinkElements) { return; }

  tagLinkElements.forEach(async tagLinkElement => {
    const unreadCountElement = Object.assign(document.createElement('span'), {
      style: 'margin-left: auto; margin-right: 1ch; opacity: 0.65;',
      innerHTML: '&ctdot;'
    });
    tagLinkElement.firstElementChild.appendChild(unreadCountElement);

    const tag = tagLinkElement.querySelector(tagTextSelector).textContent;
    const savedTimestamp = timestamps[tag] || 0;

    const { response: { timeline: { elements } } } = await apiFetch(`/v2/hubs/${tag}/timeline`, { queryParams: { limit: 20, sort: 'recent' } });
    let unreadCount = 0;

    for (const post of elements) {
      const { timestamp } = post;
      if (timestamp <= savedTimestamp) {
        break;
      } else {
        unreadCount++;
      }
    }

    if (unreadCount === elements.length) {
      unreadCount += '+';
    }

    unreadCountElement.textContent = `${unreadCount}`;
  });
};

export const main = async function () {
  searchResultSelector = await keyToCss('searchResult');
  tagTextSelector = await keyToCss('tagText');
  tagsYouFollowString = await translate('Tags you follow');

  onNewPosts.addListener(processPosts);
  processPosts();

  onBaseContainerMutated.addListener(processTagLinks);
  processTagLinks();
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  onBaseContainerMutated.removeListener(processTagLinks);
};
