import { filterPostElements, blogViewSelector, getTimelineItemWrapper } from '../util/interface.js';
import { isMyPost, timelineObject } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { translate } from '../util/language_data.js';
import { userBlogNames } from '../util/user.js';

const hiddenAttribute = 'data-show-originals-hidden';
const lengthenedClass = 'xkit-show-originals-lengthened';
const controlsClass = 'xkit-show-originals-controls';

const storageKey = 'show_originals.savedModes';
const includeFiltered = true;

let showOwnReblogs;
let showReblogsWithContributedContent;
let whitelist;
let defaultDisabledBlogs;

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
  controls.append(onButton, offButton);

  if (location === 'disabled') {
    controls.dataset.showOriginals = 'off';
  } else {
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
    blogSubscriptions: timeline.includes('blog_subscriptions') || which === 'blog_subscriptions'

  };
  const location = Object.keys(on).find(location => on[location]);
  const isDefaultDisabledBlog = defaultDisabledBlogs.some(name => timeline.startsWith(`/v2/blog/${name}/`));

  if (!location || isSinglePostBlogView) return undefined;
  if (isDefaultDisabledBlog) return 'disabled';
  return location;
};

const processTimelines = async () => {
  [...document.querySelectorAll('[data-timeline]')].forEach(async timelineElement => {
    const location = getLocation(timelineElement);

    const currentControls = [...timelineElement.children]
      .find(element => element.matches(`.${controlsClass}`));

    if (currentControls?.dataset?.location !== location) {
      currentControls?.remove();
      if (location) {
        addControls(timelineElement, location);
        lengthenTimeline(timelineElement);
      }
    }
  });
};

const processPosts = async function (postElements) {
  processTimelines();

  filterPostElements(postElements, { includeFiltered })
    .forEach(async postElement => {
      const { rebloggedRootId, content, blogName } = await timelineObject(postElement);
      const myPost = await isMyPost(postElement);
      const isInBlogView = postElement.matches(blogViewSelector);

      if (!rebloggedRootId) { return; }
      if (showOwnReblogs && myPost && !isInBlogView) { return; }
      if (showReblogsWithContributedContent && content.length > 0) { return; }
      if (whitelist.includes(blogName) && !isInBlogView) { return; }

      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
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
  defaultDisabledBlogs = [...whitelist, ...showOwnReblogs ? userBlogNames : []];

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${controlsClass}`).remove();
};

export const stylesheet = true;
