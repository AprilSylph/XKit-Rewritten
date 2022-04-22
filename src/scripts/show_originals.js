import { filterPostElements, postSelector, blogViewSelector } from '../util/interface.js';
import { timelineObject } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { translate } from '../util/language_data.js';
import { getPrimaryBlogName, getUserBlogs } from '../util/user.js';

const hiddenClass = 'xkit-show-originals-hidden';
const lengthenedClass = 'xkit-show-originals-lengthened';
const controlsClass = 'xkit-show-originals-controls';

const storageKey = 'show_originals.savedModes';
const includeFiltered = true;

let showOwnReblogs;
let showReblogsWithContributedContent;
let primaryBlogName;
let whitelist;
let disabledPeeprBlogs;

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

  const onButton = createButton(await translate('Original Posts'), handleClick, 'on');
  const offButton = createButton(await translate('All posts'), handleClick, 'off');
  const disabledButton = createButton(await translate('All posts'), null, 'disabled');

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

  const isInPeepr = timelineElement.matches(blogViewSelector);
  const isSinglePostPeepr = timeline.includes('permalink');

  const on = {
    dashboard: timeline === '/v2/timeline/dashboard',
    peepr: isInPeepr && !isSinglePostPeepr,
    blogSubscriptions: timeline === '/v2/timeline' && which === 'blog_subscriptions'
  };
  const location = Object.keys(on).find(location => on[location]);
  const isDisabledPeeprBlog = disabledPeeprBlogs.some(name => timeline.startsWith(`/v2/blog/${name}/posts`));

  if (!location || isSinglePostPeepr) return undefined;
  if (isDisabledPeeprBlog) return 'disabled';
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
      const { rebloggedRootId, canEdit, content, blogName, isSubmission, postAuthor } =
        await timelineObject(postElement);

      const isMyPost = canEdit && (isSubmission || postAuthor === primaryBlogName || postAuthor === undefined);

      if (!rebloggedRootId) { return; }
      if (showOwnReblogs && isMyPost) { return; }
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
  const nonGroupUserBlogs = (await getUserBlogs().catch(() => []))
    .filter(blog => !blog.isGroupChannel)
    .map(blog => blog.name);
  disabledPeeprBlogs = [...whitelist, ...showOwnReblogs ? nonGroupUserBlogs : []];
  primaryBlogName = await getPrimaryBlogName().catch(() => undefined);

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
