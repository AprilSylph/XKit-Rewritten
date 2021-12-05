import { getPostElements } from '../util/interface.js';
import { timelineObjectMemoized, exposeTimelines } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';

const excludeClass = 'xkit-show-originals-done';
const hiddenClass = 'xkit-show-originals-hidden';
const activeTimelineClass = 'xkit-show-originals-timeline';
const lengthenedClass = 'xkit-show-originals-lengthened';

const dashboardTimeline = '/v2/timeline/dashboard';

const processTimelines = async () => {
  const paginationCss = await keyToCss('manualPaginatorButtons');

  [...document.querySelectorAll(`[data-timeline]:not(.${excludeClass})`)]
    .forEach(timeline => {
      timeline.classList.add(excludeClass);

      if (timeline.dataset.timeline === dashboardTimeline) { // add conditional logic here
        timeline.classList.add(activeTimelineClass);

        if (!timeline.querySelector(paginationCss)) {
          timeline.classList.add(lengthenedClass);
        }
      }
    });
};

let showOwnReblogs;
let showReblogsWithContributedContent;
let whitelistedUsernames;

const processPosts = async function () {
  const whitelist = whitelistedUsernames.split(',').map(username => username.trim());

  await exposeTimelines();
  await processTimelines();

  const postElements = getPostElements({ excludeClass, includeFiltered: true })
    .filter(postElement => postElement.closest('[data-timeline]').classList.contains(activeTimelineClass));

  postElements.forEach(async postElement => {
    const { rebloggedRootId, canEdit, content, blogName } = await timelineObjectMemoized(postElement.dataset.id);

    postElement.classList.add('temporary-test-class');
    if (!rebloggedRootId) { return; }
    if (showOwnReblogs && canEdit) { return; }
    if (showReblogsWithContributedContent && content.length > 0) { return; }
    if (whitelist.includes(blogName)) { return; }

    postElement.classList.add(hiddenClass);
  });
};

export const main = async function () {
  ({ showOwnReblogs, showReblogsWithContributedContent, whitelistedUsernames } = await getPreferences('show_originals'));

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};

export const stylesheet = true;
