import { getPostElements } from '../util/interface.js';
import { timelineObjectMemoized, exposeTimelines } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';

const excludeClass = 'xkit-show-originals-done';
const hiddenClass = 'xkit-show-originals-hidden';
const lengthenedClass = 'xkit-show-originals-lengthened';

const dashboardTimeline = '/v2/timeline/dashboard';
const dashboardTimelineRegExp = new RegExp(dashboardTimeline);

const lengthenTimelines = async () => {
  const timeline =
    document.querySelector(`[data-timeline="${dashboardTimeline}"]:not(.${excludeClass})`);

  if (timeline) {
    timeline.classList.add(excludeClass);
    const paginationCss = await keyToCss('manualPaginatorButtons');

    if (!timeline.querySelector(paginationCss)) {
      timeline.classList.add(lengthenedClass);
    }
  }
};

let showOwnReblogs;
let showReblogsWithContributedContent;
let whitelistedUsernames;

const processPosts = async function () {
  const whitelist = whitelistedUsernames.split(',').map(username => username.trim());

  await exposeTimelines();
  lengthenTimelines();

  getPostElements({ excludeClass, timeline: dashboardTimelineRegExp, includeFiltered: true }).forEach(async postElement => {
    const { rebloggedRootId, canEdit, content, blogName } = await timelineObjectMemoized(postElement.dataset.id);

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
