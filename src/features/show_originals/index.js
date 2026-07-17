import { keyToCss } from '../../utils/css_map.js';
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
  anyCommunityTimelineFilter,
  communitiesTimelineFilter,
  blogpackTimelineFilter,
} from '../../utils/timeline_id.js';
import { timelineTabs } from '../../utils/timeline_tabs.js';
import { userBlogs } from '../../utils/user.js';

const hiddenAttribute = 'data-show-originals-hidden';
const lengthenedClass = 'xkit-show-originals-lengthened';
const controlsClass = 'xkit-show-originals-controls';

const channelSelector = `${keyToCss('bar')} ~ *`;

// const storageKey = 'show_originals.savedModes';
const includeFiltered = true;

let showOwnReblogs;
let showReblogsWithContributedContent;
let showReblogsOfNotFollowing;
let whitelist;
let disabledBlogs;

const getLocation = timelineElement => {
  const isBlog =
    anyBlogPostsTimelineFilter(timelineElement) && !timelineElement.matches(channelSelector);

  const on = {
    dashboard: followingTimelineFilter(timelineElement),
    disabled: isBlog && disabledBlogs.some(name => blogPostsTimelineFilter(name)(timelineElement)),
    peepr: isBlog,
    blogSubscriptions: blogSubsTimelineFilter(timelineElement),
    community: anyCommunityTimelineFilter(timelineElement) || communitiesTimelineFilter(timelineElement),
    blogpack: blogpackTimelineFilter(timelineElement),
  };
  return Object.keys(on).find(location => on[location]);
};

const timelineTabFilter = timelineElement => {
  const location = getLocation(timelineElement);
  if (location === 'disabled') return 'disabled';
  return Boolean(location);
};

const processPosts = async function (postElements) {
  timelineTabs.process();

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

      getTimelineItemWrapper(postElement).toggleAttribute(hiddenAttribute, true);
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
  timelineTabs.register({ id: 'show-originals', label: translate('Original Posts'), timelineFilter: timelineTabFilter });
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${controlsClass}`).remove();

  timelineTabs.unregister('show-originals');
};

export const stylesheet = true;
