import { buildStyle, filterPostElements } from '../util/interface.js';
import { timelineObjectMemoized, exposeTimelines } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { translate } from '../util/language_data.js';
import { getUserBlogNames } from '../util/user_blogs.js';

const excludeClass = 'xkit-show-originals-done';
const hiddenClass = 'xkit-show-originals-hidden';
const lengthenedClass = 'xkit-show-originals-lengthened';
const controlsClass = 'xkit-show-originals-controls';
const buttonClass = 'xkit-show-originals-button';

const storageKey = 'show_originals.activeLocations';
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

const processTimelines = async () => {
  await exposeTimelines();
  [...document.querySelectorAll(`[data-timeline]:not(.${excludeClass})`)]
    .forEach(async timeline => {
      timeline.classList.add(excludeClass);

      const on = {
        dashboard: timeline.dataset.timeline === '/v2/timeline/dashboard',
        peepr: timeline.closest('[role="dialog"]') !== null,
        blogSubscriptions: timeline.dataset.timeline === '/v2/timeline' &&
          timeline.dataset.which === 'blog_subscriptions'
      };
      const location = Object.keys(on).find(location => on[location]);
      const disabled = disabledBlogs.some(name => timeline.dataset.timeline.startsWith(`/v2/blog/${name}/posts`));

      if (location) {
        const { [storageKey]: savedActive = {} } = await browser.storage.local.get(storageKey);
        const active = savedActive[location] ?? true;

        const status = active ? 'on' : 'off';
        timeline.dataset.showOriginals = disabled ? 'disabled' : status;

        addControls(timeline, location, disabled);
        lengthenTimeline(timeline);
      }
    });
};

const styleElement = buildStyle(`
  .${controlsClass} {
    color: RGB(var(--white-on-dark));
    display: flex;
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.333;
    margin-bottom: 20px;
  }
  a.${buttonClass} {
    padding: 14px 16px;
    text-decoration: none;
    text-transform: capitalize;
  }
  .${buttonClass}:hover {
    background: rgba(var(--white-on-dark),.13);
  }
  [data-show-originals="on"] a.onButton,
  [data-show-originals="off"] a.offButton,
  [data-show-originals="disabled"] a.offButton {
    box-shadow: inset 0 -2px 0 RGB(var(--accent));
    color: RGB(var(--accent));
  }
`);

const addControls = async (timeline, location, disable) => {
  const handleClick = async ({ currentTarget }) => {
    if (disable) return;

    const { mode } = currentTarget.dataset;
    const active = mode === 'on';

    const timeline = currentTarget.closest('[data-timeline]');
    timeline.dataset.showOriginals = active ? 'on' : 'off';

    const { [storageKey]: savedActive = {} } = await browser.storage.local.get(storageKey);
    savedActive[location] = active;
    browser.storage.local.set({ [storageKey]: savedActive });
  };

  const controls = Object.assign(document.createElement('div'), {
    className: controlsClass
  });
  const onButton = Object.assign(document.createElement('a'), {
    className: `${buttonClass} onButton`,
    textContent: await translate('Original Posts'),
    onclick: handleClick
  });
  onButton.dataset.mode = 'on';
  const offButton = Object.assign(document.createElement('a'), {
    className: `${buttonClass} offButton`,
    textContent: await translate('All posts'),
    onclick: handleClick
  });
  offButton.dataset.mode = 'off';

  if (!disable) controls.appendChild(onButton);
  controls.appendChild(offButton);

  if (location === 'blogSubscriptions') {
    timeline.querySelector('[data-id]')?.before(controls);
  } else {
    timeline.querySelector('[data-id]')?.parentElement?.prepend(controls);
  }
};

const processPosts = async function (postElements) {
  processTimelines();

  filterPostElements(postElements, { includeFiltered })
    .forEach(async postElement => {
      const { rebloggedRootId, canEdit, content, blogName } = await timelineObjectMemoized(postElement.dataset.id);

      if (!rebloggedRootId) { return; }
      if (showOwnReblogs && canEdit) { return; }
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
  disabledBlogs = [...whitelist, ...showOwnReblogs ? await getUserBlogNames() : []];

  onNewPosts.addListener(processPosts);
  document.head.appendChild(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  $('[data-show-originals]').removeAttr('data-show-originals');
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${controlsClass}`).remove();
};

export const stylesheet = true;
