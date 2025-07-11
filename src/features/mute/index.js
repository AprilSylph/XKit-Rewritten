import { filterPostElements, postSelector, getTimelineItemWrapper } from '../../utils/interface.js';
import { registerBlogMeatballItem, registerMeatballItem, unregisterBlogMeatballItem, unregisterMeatballItem } from '../../utils/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../../utils/modals.js';
import { timelineObject } from '../../utils/react_props.js';
import { onNewPosts, pageModifications } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { dom } from '../../utils/dom.js';
import { getPreferences } from '../../utils/preferences.js';
import {
  anyBlogPostTimelineFilter,
  anyBlogTimelineFilter,
  anyDraftsTimelineFilter,
  anyFlaggedReviewTimelineFilter,
  anyPeeprTimelineFilter,
  anyQueueTimelineFilter,
  blogTimelineFilter,
  inboxTimelineFilter,
  likesTimelineFilter,
  peeprLikesTimelineFilter,
  peeprTimelineFilter,
  timelineSelector
} from '../../utils/timeline_id.js';
import { controlsClass as showOriginalsControlsClass } from '../show_originals/index.js';
import { userBlogNames } from '../../utils/user.js';

const meatballButtonId = 'mute';
const meatballButtonLabel = data => `Mute options for ${data.name ?? getVisibleBlog(data).name}`;

const hiddenAttribute = 'data-mute-hidden';
const mutedBlogControlsHiddenAttribute = 'data-muted-blog-controls-hidden';
const activeAttribute = 'data-mute-active';
const mutedBlogControlsClass = 'xkit-muted-blog-controls';
const lengthenedClass = 'xkit-mute-lengthened';

const blogNamesStorageKey = 'mute.blogNames';
const mutedBlogEntriesStorageKey = 'mute.mutedBlogEntries';

let checkTrail;
let contributedContentOriginal;

let blogNames = {};
let mutedBlogs = {};

const lengthenTimeline = timeline => {
  if (!timeline.querySelector(keyToCss('manualPaginatorButtons'))) {
    timeline.classList.add(lengthenedClass);
  }
};

// Attempts to get the blog name and blog UUID of a timeline element if it contains the posts from a single blog.
// The element itself doesn't contain both values, so a post object must be found with the required data.
const getNameAndUuid = async timelineElement => {
  for (const post of [...timelineElement.querySelectorAll(postSelector)]) {
    const { blog: { name, uuid } } = await timelineObject(post);
    if (
      blogTimelineFilter(name)(timelineElement) ||
      peeprTimelineFilter(name)(timelineElement) ||
      blogTimelineFilter(uuid)(timelineElement) ||
      peeprTimelineFilter(uuid)(timelineElement)
    ) {
      return { name, uuid };
    }
  }
  throw new Error('could not determine blog name / UUID for timeline element:', timelineElement);
};

const processBlogTimelineElement = async timelineElement => {
  const { name, uuid } = await getNameAndUuid(timelineElement);
  const mutedBlogMode = mutedBlogs[uuid];

  if (mutedBlogMode) {
    timelineElement.dataset.muteBlogUuid = uuid;

    const mutedBlogControls = dom('div', { class: mutedBlogControlsClass, 'data-muted-blog-controls-mode': mutedBlogMode }, null, [
      `You have muted ${mutedBlogMode} posts from ${name}!`,
      dom('br'),
      dom('button', null, { click: () => mutedBlogControls.remove() }, ['show posts anyway'])
    ]);
    timelineElement.prepend(mutedBlogControls);
    timelineElement.querySelector(`.${showOriginalsControlsClass}`)?.after(mutedBlogControls);
  }
};

const shouldDisable = timelineElement => Boolean(
  userBlogNames.some(name => blogTimelineFilter(name)(timelineElement)) ||
  userBlogNames.some(name => peeprTimelineFilter(name)(timelineElement)) ||
  anyDraftsTimelineFilter(timelineElement) ||
  anyQueueTimelineFilter(timelineElement) ||
  anyFlaggedReviewTimelineFilter(timelineElement) ||
  likesTimelineFilter(timelineElement) ||
  userBlogNames.some(name => peeprLikesTimelineFilter(name)(timelineElement)) ||
  inboxTimelineFilter(timelineElement) ||
  anyBlogPostTimelineFilter(timelineElement)
);

const processTimelines = async timelineElements => {
  for (const timelineElement of [...new Set(timelineElements)]) {
    const { timeline, timelineId, muteProcessedTimeline, muteProcessedTimelineId } = timelineElement.dataset;

    const alreadyProcessed =
      (timeline && timeline === muteProcessedTimeline) ||
      (timelineId && timelineId === muteProcessedTimelineId);
    if (alreadyProcessed) continue;

    timelineElement.dataset.muteProcessedTimeline = timeline;
    timelineElement.dataset.muteProcessedTimelineId = timelineId;

    [...timelineElement.querySelectorAll(`.${mutedBlogControlsClass}`)].forEach(el => el.remove());
    delete timelineElement.dataset.muteBlogUuid;
    timelineElement.removeAttribute(activeAttribute);

    if (shouldDisable(timelineElement) === false) {
      timelineElement.setAttribute(activeAttribute, '');
      lengthenTimeline(timelineElement);

      if (anyBlogTimelineFilter(timelineElement) || anyPeeprTimelineFilter(timelineElement)) {
        await processBlogTimelineElement(timelineElement).catch(console.log);
      }
    }
  }
};

const updateStoredName = (uuid, name) => {
  blogNames[uuid] = name;
  Object.keys(blogNames).forEach(uuid => {
    if (!mutedBlogs[uuid]) {
      delete blogNames[uuid];
    }
  });
  browser.storage.local.set({ [blogNamesStorageKey]: blogNames });
};

const getVisibleBlog = ({ blog, authorBlog, community }) => (community ? authorBlog : blog);

const processPosts = async function (postElements) {
  await processTimelines(postElements.map(postElement => postElement.closest(timelineSelector)));

  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const timelineObjectData = await timelineObject(postElement);
    const { uuid, name } = getVisibleBlog(timelineObjectData);
    const { rebloggedRootUuid, content = [], trail = [] } = timelineObjectData;

    const { muteBlogUuid: timelineBlogUuid } = postElement.closest(timelineSelector).dataset;

    if (mutedBlogs[uuid] && blogNames[uuid] !== name) {
      updateStoredName(uuid, name);
    }

    const hidePost = relevantBlogUuid =>
      getTimelineItemWrapper(postElement).setAttribute(
        // Posts hidden on blog timelines can be revealed by muted blog timeline controls
        // if and only if they are hidden because the current blog is muted.
        relevantBlogUuid === timelineBlogUuid
          ? mutedBlogControlsHiddenAttribute
          : hiddenAttribute,
        ''
      );

    const isRebloggedPost = contributedContentOriginal
      ? rebloggedRootUuid && !content.length
      : rebloggedRootUuid;

    const originalUuid = isRebloggedPost ? rebloggedRootUuid : uuid;
    const reblogUuid = isRebloggedPost ? uuid : null;

    if (['all', 'original'].includes(mutedBlogs[originalUuid])) {
      hidePost(originalUuid);
    }
    if (['all', 'reblogged'].includes(mutedBlogs[reblogUuid])) {
      hidePost(reblogUuid);
    }

    if (checkTrail) {
      for (const { blog } of trail) {
        if (['all'].includes(mutedBlogs[blog?.uuid])) {
          hidePost(blog.uuid);
        }
      }
    }
  });
};

const onMeatballButtonClicked = function ({ currentTarget }) {
  const { name, uuid } = currentTarget.__timelineObjectData
    ? getVisibleBlog(currentTarget.__timelineObjectData)
    : currentTarget.__blogData;

  const currentMode = mutedBlogs[uuid];

  const createRadioElement = value =>
    dom('label', null, null, [
      `Hide ${value} posts`,
      dom('input', { type: 'radio', name: 'muteOption', value })
    ]);

  const form = dom(
    'form',
    { id: 'xkit-mute-form', 'data-name': name, 'data-uuid': uuid },
    { submit: muteUser },
    [
      createRadioElement('all'),
      createRadioElement('original'),
      createRadioElement('reblogged')
    ]
  );

  form.elements.muteOption.value = currentMode;

  currentMode
    ? showModal({
      title: `Mute options for ${name}:`,
      message: [form],
      buttons: [
        modalCancelButton,
        dom('button', { class: 'blue' }, { click: () => unmuteUser(uuid) }, ['Unmute']),
        dom('input', { type: 'submit', form: form.id, class: 'red', value: 'Update Mode' })
      ]
    })
    : showModal({
      title: `Mute ${name}?`,
      message: [form],
      buttons: [
        modalCancelButton,
        dom('input', { type: 'submit', form: form.id, class: 'red', value: 'Mute' })
      ]
    });
};

const muteUser = event => {
  event.preventDefault();

  const { name, uuid } = event.currentTarget.dataset;
  const { value } = event.currentTarget.elements.muteOption;
  if (value === '') return;

  mutedBlogs[uuid] = value;
  blogNames[uuid] = name;

  browser.storage.local.set({
    [mutedBlogEntriesStorageKey]: Object.entries(mutedBlogs),
    [blogNamesStorageKey]: blogNames
  });

  hideModal();
};

const unmuteUser = uuid => {
  delete mutedBlogs[uuid];
  browser.storage.local.set({ [mutedBlogEntriesStorageKey]: Object.entries(mutedBlogs) });

  hideModal();
};

export const onStorageChanged = async function (changes, areaName) {
  const {
    [blogNamesStorageKey]: blogNamesChanges,
    [mutedBlogEntriesStorageKey]: mutedBlogsEntriesChanges
  } = changes;

  if (Object.keys(changes).some(key => key.startsWith('mute.preferences') && changes[key].oldValue !== undefined)) {
    clean().then(main);
    return;
  }

  if (blogNamesChanges) {
    ({ newValue: blogNames } = blogNamesChanges);
  }

  if (mutedBlogsEntriesChanges) {
    const { newValue: mutedBlogsEntries } = mutedBlogsEntriesChanges;
    mutedBlogs = Object.fromEntries(mutedBlogsEntries ?? []);

    unprocess();
    pageModifications.trigger(processPosts);
  }
};

export const main = async function () {
  ({ checkTrail, contributedContentOriginal } = await getPreferences('mute'));
  ({ [blogNamesStorageKey]: blogNames = {} } = await browser.storage.local.get(blogNamesStorageKey));
  const { [mutedBlogEntriesStorageKey]: mutedBlogsEntries } = await browser.storage.local.get(mutedBlogEntriesStorageKey);
  mutedBlogs = Object.fromEntries(mutedBlogsEntries ?? []);

  registerMeatballItem({
    id: meatballButtonId,
    label: meatballButtonLabel,
    onclick: onMeatballButtonClicked
  });
  registerBlogMeatballItem({
    id: meatballButtonId,
    label: meatballButtonLabel,
    onclick: onMeatballButtonClicked
  });
  onNewPosts.addListener(processPosts);
};

const unprocess = () => {
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`[${mutedBlogControlsHiddenAttribute}]`).removeAttr(mutedBlogControlsHiddenAttribute);
  $(`[${activeAttribute}]`).removeAttr(activeAttribute);
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${mutedBlogControlsClass}`).remove();
  $('[data-mute-processed-timeline]').removeAttr('data-mute-processed-timeline');
  $('[data-mute-processed-timeline-id]').removeAttr('data-mute-processed-timeline-id');
  $('[data-mute-blog-uuid]').removeAttr('data-mute-blog-uuid');
};

export const clean = async function () {
  unprocess();
  unregisterMeatballItem(meatballButtonId);
  unregisterBlogMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);
};

export const stylesheet = true;
