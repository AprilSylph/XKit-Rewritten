import { filterPostElements, getTimelineItemWrapper } from '../util/interface.js';
import { isMyPost, timelineObject } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { translate } from '../util/language_data.js';
import { userBlogs } from '../util/user.js';

const hiddenAttribute = 'data-show-originals-hidden';
const lengthenedClass = 'xkit-show-originals-lengthened';
const controlsClass = 'xkit-show-originals-controls';

// todo: update for future patio id tweaks
const followingTimelineIdRegex = /(^\/dashboard\/following$)|(^following-)/;

const blogTimelineRegex = /^\/v2\/blog\/[a-z0-9-]{1,32}\/posts$/;
const blogTimelineIdRegex = /^peepr-posts-[a-z0-9-]{1,32}-undefined/;

// todo: update for future patio id tweaks
const patioBlogTimelineIdRegex = /^blog-.*-[a-z0-9-]{1,32}$/;
const patioSelector = '.__draggable-item__ *';

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

const createButton = (textContent, onclick, mode) => {
  const button = Object.assign(document.createElement('a'), { textContent, onclick });
  button.dataset.mode = mode;
  return button;
};

const addControls = async (timelineElement, location) => {
  const controls = Object.assign(document.createElement('div'), { className: controlsClass });
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
  const { timeline, timelineId, which } = timelineElement.dataset;

  const isBlog =
    (blogTimelineRegex.test(timeline) && !timelineElement.matches(channelSelector)) ||
    blogTimelineIdRegex.test(timelineId) ||
    (patioBlogTimelineIdRegex.test(timelineId) && timelineElement.matches(patioSelector));

  const on = {
    dashboard:
      timeline === '/v2/timeline/dashboard' || followingTimelineIdRegex.test(timelineId),
    disabled:
      isBlog &&
      disabledBlogs.some(
        name =>
          timeline === `/v2/blog/${name}/posts` ||
          timelineId?.startsWith(`peepr-posts-${name}-undefined`) ||
          (timelineId?.startsWith('blog-') &&
            timelineId?.endsWith(`-${name}`) &&
            timelineElement.matches(patioSelector))
      ),
    peepr: isBlog,
    blogSubscriptions:
      timeline?.includes('blog_subscriptions') || which === 'blog_subscriptions' ||
      timelineId === '/dashboard/blog_subs'
  };
  return Object.keys(on).find(location => on[location]);
};

const processTimelines = async () => {
  [...document.querySelectorAll(':is([data-timeline], [data-timeline-id])')].forEach(async timelineElement => {
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
      const { rebloggedRootId, content, blogName, rebloggedFromFollowing } = await timelineObject(postElement);
      const myPost = await isMyPost(postElement);

      if (!rebloggedRootId) { return; }
      if (showOwnReblogs && myPost) { return; }
      if (showReblogsWithContributedContent && content.length > 0) { return; }
      if (showReblogsOfNotFollowing && !rebloggedFromFollowing) { return; }
      if (whitelist.includes(blogName)) { return; }

      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
    });
};

export const main = async function () {
  let whitelistedUsernames;
  ({
    showOwnReblogs,
    showReblogsWithContributedContent,
    showReblogsOfNotFollowing,
    whitelistedUsernames
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
