import { filterPostElements, blogViewSelector, postSelector } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { timelineObject } from '../util/react_props.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';

const meatballButtonId = 'mute';
const meatballButtonLabel = 'Mute options';

const hiddenClass = 'xkit-mute-hidden';
const onBlogHiddenClass = 'xkit-mute-hidden-on-blog';
const activeClass = 'xkit-mute-active';
const warningClass = 'xkit-mute-warning';
const lengthenedClass = 'xkit-mute-lengthened';

const namesStorageKey = 'mute.names';
const mutedBlogsEntriesStorageKey = 'mute.mutedBlogEntries';

let names = {};
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
    const isChannel = timeline.startsWith('/v2/blog/') && !timelineElement.matches(blogViewSelector);
    const isSinglePostBlogView = timeline.includes('permalink');

    if (!alreadyProcessed && !isChannel && !isSinglePostBlogView) {
      timelineElement.dataset.muteProcessedTimeline = timeline;

      timelineElement.classList.add(activeClass);
      lengthenTimeline(timelineElement);

      if (timelineElement.previousElementSibling?.classList?.contains(warningClass)) {
        timelineElement.previousElementSibling.remove();
      }
      delete timelineElement.dataset.muteOnBlogUuid;

      if (timeline.startsWith('/v2/blog/')) {
        await processBlogSpecificTimeline(timelineElement, timeline);
      }
    }
  }
};

const updateNames = () => {
  Object.keys(names).forEach(uuid => {
    if (!mutedBlogs[uuid]) {
      delete names[uuid];
    }
  });
  browser.storage.local.set({ [namesStorageKey]: names });
};

const processPosts = async function (postElements) {
  await processTimelines(postElements.map(postElement => postElement.closest('[data-timeline]')));

  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const { blog: { name, uuid }, rebloggedRootUuid } = await timelineObject(postElement);
    const { muteOnBlogUuid: onBlogUuid } = postElement.closest('[data-timeline]').dataset;

    if (mutedBlogs[uuid] && names[uuid] !== name) {
      names[uuid] = name;
      updateNames();
    }

    const isRebloggedPost = Boolean(rebloggedRootUuid);

    const originalUuid = isRebloggedPost ? rebloggedRootUuid : uuid;
    const reblogUuid = isRebloggedPost ? uuid : null;

    if (['all', 'original'].includes(mutedBlogs[originalUuid])) {
      postElement.classList.add(originalUuid === onBlogUuid ? onBlogHiddenClass : hiddenClass);
    }
    if (['all', 'reblogged'].includes(mutedBlogs[reblogUuid])) {
      postElement.classList.add(reblogUuid === onBlogUuid ? onBlogHiddenClass : hiddenClass);
    }
  });
};

const onMeatballButtonClicked = function ({ currentTarget }) {
  const { blog: { name, uuid } } = currentTarget.__timelineObjectData;

  const currentMode = mutedBlogs[uuid];

  const createRadioElement = value =>
    dom('label', null, null, [
      dom('input', { type: 'radio', name: 'muteOption', value }),
      `Hide ${value} posts`
    ]);

  const form = dom('form', { id: 'xkit-mute-form', 'data-name': name, 'data-uuid': uuid }, { submit: muteUser }, [
    createRadioElement('all'),
    createRadioElement('original'),
    createRadioElement('reblogged')
  ]);

  form.elements.muteOption.value = currentMode;

  showModal({
    title: `Mute ${name}`,
    message: [form],
    buttons: [
      modalCancelButton,
      ...currentMode ? [dom('button', { class: 'blue' }, { click: () => unmuteUser(uuid) }, ['Unmute'])] : [],
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
  names[uuid] = name;

  browser.storage.local.set({ [mutedBlogsEntriesStorageKey]: Object.entries(mutedBlogs) });
  browser.storage.local.set({ [namesStorageKey]: names });

  hideModal();
};

const unmuteUser = uuid => {
  delete mutedBlogs[uuid];
  browser.storage.local.set({ [mutedBlogsEntriesStorageKey]: Object.entries(mutedBlogs) });

  hideModal();
};

export const onStorageChanged = async function (changes, areaName) {
  const {
    [namesStorageKey]: namesChanges,
    [mutedBlogsEntriesStorageKey]: mutedBlogsEntriesChanges
  } = changes;

  if (mutedBlogsEntriesChanges) {
    clean().then(main);
    return;
  }

  if (namesChanges) {
    ({ newValue: names } = namesChanges);
  }
};

export const main = async function () {
  ({ [namesStorageKey]: names = {} } = await browser.storage.local.get(namesStorageKey));
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
  $('[data-mute-on-blog-uuid]').removeAttr('data-mute-blog-specific-uuid');
};

export const stylesheet = true;
