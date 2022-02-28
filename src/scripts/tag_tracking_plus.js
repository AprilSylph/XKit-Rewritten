import { apiFetch } from '../util/tumblr_helpers.js';
import { filterPostElements } from '../util/interface.js';
import { exposeTimelines, timelineObjectMemoized } from '../util/react_props.js';
import { keyToCss } from '../util/css_map.js';
import { onNewPosts, pageModifications } from '../util/mutations.js';
import { translate } from '../util/language_data.js';

const storageKey = 'tag_tracking_plus.trackedTagTimestamps';

const excludeClass = 'xkit-tag-tracking-plus-done';
const includeFiltered = true;

let searchResultSelector;
let tagTextSelector;
let tagsYouFollowString;

const processPosts = async function (postElements) {
  const { pathname, searchParams } = new URL(location);
  if (!pathname.startsWith('/tagged/') || searchParams.get('sort') === 'top') {
    return;
  }

  const encodedCurrentTag = pathname.split('/')[2];
  const currentTag = decodeURIComponent(encodedCurrentTag);
  const { response: { following } } = await apiFetch('/v2/user/tags/following', { queryParams: { tag: currentTag } });
  if (!following) { return; }

  const { [storageKey]: timestamps = {} } = await browser.storage.local.get(storageKey);
  const timeline = new RegExp(`/v2/hubs/${encodedCurrentTag}/timeline`);
  await exposeTimelines();

  for (const postElement of filterPostElements(postElements, { excludeClass, timeline, includeFiltered })) {
    const { timestamp } = await timelineObjectMemoized(postElement.dataset.id);
    const savedTimestamp = timestamps[currentTag] || 0;

    if (timestamp > savedTimestamp) {
      timestamps[currentTag] = timestamp;
    }
  }
  browser.storage.local.set({ [storageKey]: timestamps });
};

const processTagLinks = async function ([searchResultElement]) {
  if (searchResultElement.classList.contains(excludeClass)) return;
  searchResultElement.classList.add(excludeClass);

  const { [storageKey]: timestamps = {} } = await browser.storage.local.get(storageKey);

  const tagsYouFollowHeading = [...searchResultElement.querySelectorAll('h3')].find(h3 => h3.textContent === tagsYouFollowString);
  if (!tagsYouFollowHeading) { return; }
  tagsYouFollowHeading.dataset.followedTags = true;

  const tagLinkElements = searchResultElement.querySelectorAll('[data-followed-tags] ~ [href^="/tagged/"]');

  tagLinkElements.forEach(async tagLinkElement => {
    const unreadCountElement = Object.assign(document.createElement('span'), {
      style: 'margin-left: auto; margin-right: 1ch; opacity: 0.65;',
      innerHTML: '&ctdot;'
    });
    tagLinkElement.firstElementChild.appendChild(unreadCountElement);

    const tag = tagLinkElement.querySelector(tagTextSelector).textContent;
    const savedTimestamp = timestamps[tag] || 0;

    const { response: { timeline: { elements = [], links } } } = await apiFetch(`/v2/hubs/${tag}/timeline`, { queryParams: { limit: 20, sort: 'recent' } });
    const posts = elements.filter(({ objectType }) => objectType === 'post');
    let unreadCount = 0;

    for (const { timestamp } of posts) {
      if (timestamp <= savedTimestamp) {
        break;
      } else {
        unreadCount++;
      }
    }

    if (unreadCount === posts.length && links?.next) {
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
  pageModifications.register(searchResultSelector, processTagLinks);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  pageModifications.unregister(processTagLinks);
};
