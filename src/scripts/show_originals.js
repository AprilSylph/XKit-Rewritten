import { getPostElements } from '../util/interface.js';
import { timelineObjectMemoized, exposeTimelines } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';

const excludeClass = 'xkit-show-originals-done';
const hiddenClass = 'xkit-show-originals-hidden';
const activeTimelineClass = 'xkit-show-originals-timeline';
const lengthenedClass = 'xkit-show-originals-lengthened';

let showOwnReblogs;
let showReblogsWithContributedContent;
let whitelistedUsernames;
let runOnDashboard;
let runOnPeepr;
let runOnBlogSubscriptions;

const lengthenTimeline = async (timeline) => {
  const paginationCss = await keyToCss('manualPaginatorButtons');

  if (!timeline.querySelector(paginationCss)) {
    timeline.classList.add(lengthenedClass);
  }
};

const processTimelines = () => {
  [...document.querySelectorAll(`[data-timeline]:not(.${excludeClass})`)]
    .forEach(timeline => {
      timeline.classList.add(excludeClass);

      const onDashboard = timeline.dataset.timeline === '/v2/timeline/dashboard';
      const isSinglePostPeepr = timeline.dataset.timeline.includes('permalink');
      const onPeepr = timeline.closest('[role="dialog"]') !== null && isSinglePostPeepr === false;
      const onBlogSubscriptions = timeline.dataset.timeline === '/v2/timeline' &&
        timeline.dataset.which === 'blog_subscriptions';

      const shouldRun =
        (runOnDashboard && onDashboard) ||
        (runOnPeepr && onPeepr) ||
        (runOnBlogSubscriptions && onBlogSubscriptions);

      if (shouldRun) {
        timeline.classList.add(activeTimelineClass);
        lengthenTimeline(timeline);
      }
    });
};

const processPosts = async function () {
  const whitelist = whitelistedUsernames.split(',').map(username => username.trim());

  await exposeTimelines();
  processTimelines();

  const postElements = getPostElements({ excludeClass, includeFiltered: true })
    .filter(postElement => postElement.closest('[data-timeline]').classList.contains(activeTimelineClass));

  postElements.forEach(async postElement => {
    const { rebloggedRootId, canEdit, content, blogName } = await timelineObjectMemoized(postElement.dataset.id);

    if (!rebloggedRootId) { return; }
    if (showOwnReblogs && canEdit) { return; }
    if (showReblogsWithContributedContent && content.length > 0) { return; }
    if (whitelist.includes(blogName)) { return; }

    postElement.classList.add(hiddenClass);
  });
};

export const main = async function () {
  ({
    showOwnReblogs,
    showReblogsWithContributedContent,
    whitelistedUsernames,
    runOnDashboard,
    runOnPeepr,
    runOnBlogSubscriptions
  } = await getPreferences('show_originals'));

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  $(`.${activeTimelineClass}`).removeClass(activeTimelineClass);
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
};

export const stylesheet = true;
