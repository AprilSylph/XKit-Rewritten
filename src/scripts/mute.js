import { filterPostElements, blogViewSelector, postSelector } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { timelineObject } from '../util/react_props.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { getPreferences } from '../util/preferences.js';

const meatballButtonId = 'mute';
const meatballButtonLabel = 'User mute options';

const hiddenClass = 'xkit-mute-hidden';
const onBlogHiddenClass = 'xkit-mute-hidden-on-blog';
const activeClass = 'xkit-mute-active';
const warningClass = 'xkit-mute-warning';
const lengthenedClass = 'xkit-mute-lengthened';

const blogNamesStorageKey = 'mute.blogNames';
const mutedBlogsEntriesStorageKey = 'mute.mutedBlogEntries';

let checkTrail;
let contributedContentOriginal;

let blogNames = {};
let mutedBlogs = {};

const lengthenTimeline = timeline => {
  if (!timeline.querySelector(keyToCss('manualPaginatorButtons'))) {
    timeline.classList.add(lengthenedClass);
  }
};

const getNameAndUuid = async (timelineElement, timeline) => {
  const uuidOrName = timeline.split('/')?.[3];
  const posts = [...timelineElement.querySelectorAll(postSelector)];
  for (const post of posts) {
    const { blog: { name, uuid } } = await timelineObject(post);
    if ([name, uuid].includes(uuidOrName)) return [name, uuid];
  }
  throw new Error(`could not determine blog name / UUID for timeline with ${timeline}`);
};

const processBlogSpecificTimeline = async (timelineElement, timeline) => {
  const [name, uuid] = await getNameAndUuid(timelineElement, timeline);
  const mode = mutedBlogs[uuid];

  timelineElement.dataset.muteOnBlogUuid = uuid;

  if (mode) {
    const warningElement = dom('div', { class: warningClass }, null, [
      `You have muted ${mode} posts from ${name}!`,
      dom('br'),
      dom('button', null, { click: () => warningElement.remove() }, 'show posts anyway')
    ]);
    warningElement.dataset.muteMode = mode;

    const firstPost = timelineElement.querySelector(postSelector);
    firstPost?.parentElement?.prepend(warningElement);
  }
};

const processTimelines = async (timelineElements) => {
  for (const timelineElement of [...new Set(timelineElements)]) {
    const { timeline, muteProcessedTimeline } = timelineElement.dataset;

    const alreadyProcessed = timeline === muteProcessedTimeline;
    if (alreadyProcessed) return;

    timelineElement.dataset.muteProcessedTimeline = timeline;

    [...timelineElement.querySelectorAll(`.${warningClass}`)].forEach(el => el.remove());
    delete timelineElement.dataset.muteOnBlogUuid;

    const isChannel = timeline.startsWith('/v2/blog/') && !timelineElement.matches(blogViewSelector);
    const isSinglePostBlogView = timeline.endsWith('/permalink');
    const isLikes = timeline.endsWith('/likes');

    if (!isChannel && !isSinglePostBlogView && !isLikes) {
      timelineElement.classList.add(activeClass);
      lengthenTimeline(timelineElement);

      if (timeline.startsWith('/v2/blog/')) {
        await processBlogSpecificTimeline(timelineElement, timeline);
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

const processPosts = async function (postElements) {
  await processTimelines(postElements.map(postElement => postElement.closest('[data-timeline]')));

  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const {
      blog: { uuid, name },
      rebloggedRootUuid,
      content = [],
      trail = []
    } = await timelineObject(postElement);
    const { muteOnBlogUuid: currentBlogViewUuid } = postElement.closest('[data-timeline]').dataset;

    if (mutedBlogs[uuid] && blogNames[uuid] !== name) {
      updateStoredName(uuid, name);
    }

    const isRebloggedPost = contributedContentOriginal
      ? rebloggedRootUuid && !content.length
      : rebloggedRootUuid;

    const originalUuid = isRebloggedPost ? rebloggedRootUuid : uuid;
    const reblogUuid = isRebloggedPost ? uuid : null;

    if (['all', 'original'].includes(mutedBlogs[originalUuid])) {
      postElement.classList.add(originalUuid === currentBlogViewUuid ? onBlogHiddenClass : hiddenClass);
    }
    if (['all', 'reblogged'].includes(mutedBlogs[reblogUuid])) {
      postElement.classList.add(reblogUuid === currentBlogViewUuid ? onBlogHiddenClass : hiddenClass);
    }

    if (checkTrail) {
      for (const { blog } of trail) {
        if (['all'].includes(mutedBlogs[blog?.uuid])) {
          postElement.classList.add(
            blog?.uuid === currentBlogViewUuid ? onBlogHiddenClass : hiddenClass
          );
        }
      }
    }
  });
};

const onMeatballButtonClicked = function ({ currentTarget }) {
  const { blog: { name, uuid } } = currentTarget.__timelineObjectData;

  const currentMode = mutedBlogs[uuid];

  const createRadioElement = value =>
    dom('label', null, null, [
      `Hide ${value} posts`,
      dom('input', { type: 'radio', name: 'muteOption', value })
    ]);

  const form = dom('form', { id: 'xkit-mute-form', 'data-name': name, 'data-uuid': uuid }, { submit: muteUser }, [
    createRadioElement('all'),
    createRadioElement('original'),
    createRadioElement('reblogged')
  ]);

  form.elements.muteOption.value = currentMode;

  showModal({
    title: currentMode ? `Mute options for ${name}:` : `Mute ${name}?`,
    message: [form],
    buttons: currentMode
      ? [
          modalCancelButton,
          dom('button', { class: 'blue' }, { click: () => unmuteUser(uuid) }, ['Unmute']),
          dom('input', { type: 'submit', form: form.id, class: 'red', value: 'Update Mute' })
        ]
      : [
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

  browser.storage.local.set({ [mutedBlogsEntriesStorageKey]: Object.entries(mutedBlogs) });
  browser.storage.local.set({ [blogNamesStorageKey]: blogNames });

  hideModal();
};

const unmuteUser = uuid => {
  delete mutedBlogs[uuid];
  browser.storage.local.set({ [mutedBlogsEntriesStorageKey]: Object.entries(mutedBlogs) });

  hideModal();
};

export const onStorageChanged = async function (changes, areaName) {
  const {
    [blogNamesStorageKey]: blogNamesChanges,
    [mutedBlogsEntriesStorageKey]: mutedBlogsEntriesChanges
  } = changes;

  if (
    Object.keys(changes).some(key => key.startsWith('mute') && changes[key].oldValue !== undefined) ||
    mutedBlogsEntriesChanges
  ) {
    clean().then(main);
    return;
  }

  if (blogNamesChanges) {
    ({ newValue: blogNames } = blogNamesChanges);
  }
};

export const main = async function () {
  ({ checkTrail, contributedContentOriginal } = await getPreferences('mute'));
  ({ [blogNamesStorageKey]: blogNames = {} } = await browser.storage.local.get(blogNamesStorageKey));
  const { [mutedBlogsEntriesStorageKey]: mutedBlogsEntries } = await browser.storage.local.get(mutedBlogsEntriesStorageKey);
  mutedBlogs = Object.fromEntries(mutedBlogsEntries ?? []);

  registerMeatballItem({
    id: meatballButtonId,
    label: meatballButtonLabel,
    onclick: onMeatballButtonClicked
  });
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`.${hiddenClass}`).removeClass(hiddenClass);
  $(`.${onBlogHiddenClass}`).removeClass(onBlogHiddenClass);
  $(`.${activeClass}`).removeClass(activeClass);
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${warningClass}`).remove();
  $('[data-mute-processed-timeline]').removeAttr('data-mute-processed-timeline');
  $('[data-mute-on-blog-uuid]').removeAttr('data-mute-on-blog-uuid');
};

export const stylesheet = true;
