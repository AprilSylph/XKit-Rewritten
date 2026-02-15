import { keyToCss } from '../../utils/css_map.js';
import { a, div } from '../../utils/dom.js';
import { filterPostElements, getTimelineItemWrapper } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { onNewPosts } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';
import { isMyPost, timelineObject } from '../../utils/react_props.js';
import {
  followingTimelineFilter,
  anyBlogPostsTimelineFilter,
  blogPostsTimelineFilter,
  blogSubsTimelineFilter,
  timelineSelector,
  anyCommunityTimelineFilter,
  communitiesTimelineFilter,
} from '../../utils/timeline_id.js';
import { userBlogs } from '../../utils/user.js';

const hiddenAttribute = 'data-show-originals-hidden';
const lengthenedClass = 'xkit-show-originals-lengthened';
const controlsClass = 'xkit-show-originals-controls';

const channelSelector = `${keyToCss('bar')} ~ *`;

const storageKey = 'show_originals.savedModes';
const includeFiltered = true;

let showOwnReblogs;
let showReblogsWithContributedContent;
let showReblogsOfNotFollowing;
let whitelist;
let disabledBlogs;

const lengthenTimeline = async (timeline) => {
  if (!timeline.querySelector(keyToCss('manualPaginatorButtons'))) {
    timeline.classList.add(lengthenedClass);
  }
};

const createButton = (buttonText, onclick, mode) =>
  a({ 'data-mode': mode, click: onclick }, [buttonText]);

const addControls = async (timelineElement, location) => {
  const controls = div({ class: controlsClass });
  controls.dataset.location = location;

  timelineElement.prepend(controls);

  const handleClick = async ({ currentTarget: { dataset: { mode } } }) => {
    controls.dataset.showOriginals = mode;

    const { [storageKey]: savedModes = {} } = await browser.storage.local.get(storageKey);
    savedModes[location] = mode;
    browser.storage.local.set({ [storageKey]: savedModes });
  };

  const onButton = createButton(translate('Original Posts'), handleClick, 'on');
  const offButton = createButton(translate('All posts'), handleClick, 'off');
  const disabledButton = createButton(translate('All posts'), null, 'disabled');

  if (location === 'disabled') {
    controls.append(disabledButton);
  } else {
    controls.append(onButton, offButton);

    lengthenTimeline(timelineElement);
    const { [storageKey]: savedModes = {} } = await browser.storage.local.get(storageKey);
    const mode = savedModes[location] ?? 'on';
    controls.dataset.showOriginals = mode;
  }
};

const getLocation = timelineElement => {
  const isBlog =
    anyBlogPostsTimelineFilter(timelineElement) && !timelineElement.matches(channelSelector);

  const on = {
    dashboard: followingTimelineFilter(timelineElement),
    disabled: isBlog && disabledBlogs.some(name => blogPostsTimelineFilter(name)(timelineElement)),
    peepr: isBlog,
    blogSubscriptions: blogSubsTimelineFilter(timelineElement),
    community: anyCommunityTimelineFilter(timelineElement) || communitiesTimelineFilter(timelineElement),
  };
  return Object.keys(on).find(location => on[location]);
};

const processTimelines = async () => {
  [...document.querySelectorAll(timelineSelector)].forEach(async timelineElement => {
    const location = getLocation(timelineElement);

    const currentControls = [...timelineElement.children]
      .find(element => element.matches(`.${controlsClass}`));

    if (currentControls?.dataset?.location !== location) {
      currentControls?.remove();
      if (location) addControls(timelineElement, location);
    }
  });
};

const processPosts = async function (postElements) {
  processTimelines();

  filterPostElements(postElements, { includeFiltered })
    .forEach(async postElement => {
      const { rebloggedRootId, content, blogName, community, postAuthor, rebloggedFromFollowing, trail } = await timelineObject(postElement);
      const myPost = await isMyPost(postElement);

      if (!rebloggedRootId) { return; }
      if (showOwnReblogs && myPost) { return; }
      if (showReblogsWithContributedContent && content.length > 0) { return; }
      if (showReblogsOfNotFollowing && !(rebloggedFromFollowing || trail.at(-1)?.blog?.followed)) { return; }
      const visibleBlogName = community ? postAuthor : blogName;
      if (whitelist.includes(visibleBlogName)) { return; }

      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
    });
};

export const main = async function () {
  let whitelistedUsernames;
  ({
    showOwnReblogs,
    showReblogsWithContributedContent,
    showReblogsOfNotFollowing,
    whitelistedUsernames,
  } = await getPreferences('show_originals'));

  whitelist = whitelistedUsernames.split(',').map(username => username.trim());
  const nonGroupUserBlogs = userBlogs
    .filter(blog => !blog.isGroupChannel)
    .map(blog => blog.name);
  disabledBlogs = [...whitelist, ...showOwnReblogs ? nonGroupUserBlogs : []];

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${controlsClass}`).remove();
};

export const stylesheet = true;
