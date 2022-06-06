import { filterPostElements, postSelector, blogViewSelector } from '../util/interface.js';
import { isMyPost, timelineObject } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { translate } from '../util/language_data.js';
import { userBlogs } from '../util/user.js';

const hiddenClass = 'xkit-show-originals-hidden';
const lengthenedClass = 'xkit-show-originals-lengthened';
const controlsClass = 'xkit-show-originals-controls';

const storageKey = 'show_originals.savedModes';
const includeFiltered = true;

let showOwnReblogs;
let showReblogsWithContributedContent;
let whitelist;
let disabledBlogs;

const lengthenTimeline = async (timeline) => {
  const paginatorSelector = await keyToCss('manualPaginatorButtons');

  if (!timeline.querySelector(paginatorSelector)) {
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

  const firstPost = timelineElement.querySelector(postSelector);
  location === 'blogSubscriptions'
    ? firstPost?.before(controls)
    : firstPost?.parentElement?.prepend(controls);

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
  const { timeline, which } = timelineElement.dataset;

  const isInBlogView = timelineElement.matches(blogViewSelector);
  const isSinglePostBlogView = timeline.includes('permalink');

  const on = {
    dashboard: timeline === '/v2/timeline/dashboard',
    peepr: isInBlogView && !isSinglePostBlogView,
    blogSubscriptions: timeline === '/v2/timeline' && which === 'blog_subscriptions'
  };
  const location = Object.keys(on).find(location => on[location]);
  const isDisabledBlog = disabledBlogs.some(name => timeline.startsWith(`/v2/blog/${name}/posts`));

  if (!location || isSinglePostBlogView) return undefined;
  if (isDisabledBlog) return 'disabled';
  return location;
};

const processTimelines = async () => {
  [...document.querySelectorAll('[data-timeline]')].forEach(async timelineElement => {
    const location = getLocation(timelineElement);

    const currentControls = timelineElement.querySelector(`.${controlsClass}`);
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
      const { rebloggedRootId, content, blogName } = await timelineObject(postElement);
      const myPost = await isMyPost(postElement);

      if (!rebloggedRootId) { return; }
      if (showOwnReblogs && myPost) { return; }
      if (showReblogsWithContributedContent && content.length > 0) { return; }
      if (whitelist.includes(blogName)) { return; }

      postElement.classList.add(hiddenClass);
    });
};

export const main = async function () {
  let whitelistedUsernames;
  ({
    showOwnReblogs,
    showReblogsWithContributedContent,
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

  $(`.${hiddenClass}`).removeClass(hiddenClass);
  $('[data-show-originals]').removeAttr('data-show-originals');
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${controlsClass}`).remove();
};

export const stylesheet = true;
