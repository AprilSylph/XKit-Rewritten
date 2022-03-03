import { filterPostElements } from '../util/interface.js';
import { timelineObject, exposeTimelines } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { translate } from '../util/language_data.js';
import { getPrimaryBlogName, getUserBlogs } from '../util/user_blogs.js';

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

const addControls = async (timelineElement, location, disabled) => {
  const handleClick = async ({ currentTarget: { dataset: { mode } } }) => {
    timelineElement.dataset.showOriginals = mode;

    const { [storageKey]: savedModes = {} } = await browser.storage.local.get(storageKey);
    savedModes[location] = mode;
    browser.storage.local.set({ [storageKey]: savedModes });
  };

  const controls = Object.assign(document.createElement('div'), { className: controlsClass });

  const onButton = createButton(await translate('Original Posts'), handleClick, 'on');
  const offButton = createButton(await translate('All posts'), handleClick, 'off');
  const disabledButton = createButton(await translate('All posts'), null, 'disabled');

  controls.append(...disabled ? [disabledButton] : [onButton, offButton]);

  if (location === 'blogSubscriptions') {
    timelineElement.querySelector('[data-id]')?.before(controls);
  } else {
    timelineElement.querySelector('[data-id]')?.parentElement?.prepend(controls);
  }
};

const processTimelines = async () => {
  await exposeTimelines();
  [...document.querySelectorAll('[data-timeline]')]
    .forEach(async timelineElement => {
      const { timeline, which } = timelineElement.dataset;

      const isInPeepr = getComputedStyle(timelineElement).getPropertyValue('--blog-title-color') !== '';
      const isSinglePostPeepr = timeline.includes('permalink');

      const on = {
        dashboard: timeline === '/v2/timeline/dashboard',
        peepr: isInPeepr && !isSinglePostPeepr,
        blogSubscriptions: timeline === '/v2/timeline' && which === 'blog_subscriptions'
      };
      const location = Object.keys(on).find(location => on[location]);
      const isDisabledPeeprBlog = disabledPeeprBlogs.some(name => timeline.startsWith(`/v2/blog/${name}/posts`));

      if (location && timelineElement.querySelector(`.${controlsClass}`) === null) {
        addControls(timelineElement, location, isDisabledPeeprBlog);
        if (isDisabledPeeprBlog) return;

        lengthenTimeline(timelineElement);
        const { [storageKey]: savedModes = {} } = await browser.storage.local.get(storageKey);
        const mode = savedModes[location] ?? 'on';
        timelineElement.dataset.showOriginals = mode;
      }
    });
};

const processPosts = async function (postElements) {
  processTimelines();

  filterPostElements(postElements, { includeFiltered })
    .forEach(async postElement => {
      const { rebloggedRootId, canEdit, content, blogName, isSubmission, postAuthor } =
        await timelineObjectMemoized(postElement.dataset.id);

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
