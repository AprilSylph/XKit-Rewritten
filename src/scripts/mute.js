import { filterPostElements, blogViewSelector, postSelector } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { timelineObject } from '../util/react_props.js';
import { onNewPosts, pageModifications } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';

const meatballButtonId = 'mute';
const meatballButtonLabel = 'Mute options';

const hiddenClass = 'xkit-mute-hidden';
const activeClass = 'xkit-mute-active';
const warningClass = 'xkit-mute-warning';
const lengthenedClass = 'xkit-mute-lengthened';

const storageKey = 'mute.mutedblogs';

let mutedBlogs = {};
const dismissedWarningUuids = new Set();

const lengthenTimeline = timeline => {
  if (!timeline.querySelector(keyToCss('manualPaginatorButtons'))) {
    timeline.classList.add(lengthenedClass);
  }
};

const getCurrentUuid = async (timelineElement, timeline) => {
  const uuidOrName = timeline.split('/')?.[3];

  if (uuidOrName.startsWith('t:')) return uuidOrName;

  const posts = [...timelineElement.querySelectorAll(postSelector)];
  for (const post of posts) {
    const { blog: { name, uuid } } = await timelineObject(post);
    if (name === uuidOrName || uuid === uuidOrName) return uuid;
  }

  throw new Error(`could not determine UUID of timeline ${timeline}`);
};

const processBlogSpecificTimeline = async (timelineElement, timeline) => {
  const currentUuid = await getCurrentUuid(timelineElement, timeline);

  const mutedBlogEntry = Object.entries(mutedBlogs).find(([uuid]) => currentUuid === uuid);

  if (mutedBlogEntry) {
    const [uuid, [name, mode]] = mutedBlogEntry;

    if (mode === 'all') {
      timelineElement.dataset.muteExcludedUuid = uuid;

      if (!dismissedWarningUuids.has(uuid)) {
        const warningElement = dom('div', { class: warningClass }, null, [
          `You have muted all posts from ${name}!`,
          dom('br'),
          dom('button', null, {
            click: () => {
              dismissedWarningUuids.add(uuid);
              warningElement.remove();
            }
          }, 'show posts anyway')
        ]);
        timelineElement.before(warningElement);
      }
    }
  }
};

const processTimelines = () => {
  [...document.querySelectorAll('[data-timeline]')].forEach(timelineElement => {
    const { timeline, muteProcessedTimeline } = timelineElement.dataset;

    const alreadyProcessed = timeline === muteProcessedTimeline;
    const isChannel = timeline.startsWith('/v2/blog/') && !timelineElement.matches(blogViewSelector);

    if (!alreadyProcessed && !isChannel) {
      timelineElement.dataset.muteProcessedTimeline = timeline;

      timelineElement.classList.add(activeClass);
      lengthenTimeline(timelineElement);

      if (timelineElement.previousElementSibling?.classList?.contains(warningClass)) {
        timelineElement.previousElementSibling.remove();
      }
      delete timelineElement.dataset.muteExcludedUuid;

      if (timeline.startsWith('/v2/blog/')) {
        processBlogSpecificTimeline(timelineElement, timeline);
      }
    }
  });
};

const processPosts = function (postElements) {
  processTimelines();

  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const { blog: { uuid }, rebloggedRootUuid, content } = await timelineObject(postElement);
    const { muteExcludedUuid } = postElement.closest('[data-timeline]').dataset;

    // should there be a setting such that reblogs with contributed content count?
    // eslint-disable-next-line no-unused-vars
    const contributedContent = content.length > 0;
    const isRebloggedPost = Boolean(rebloggedRootUuid);

    const originalUuid = isRebloggedPost ? rebloggedRootUuid : uuid;
    const reblogUuid = isRebloggedPost ? uuid : null;

    if (originalUuid !== muteExcludedUuid && ['all', 'original'].includes(mutedBlogs[originalUuid]?.[1])) {
      postElement.classList.add(hiddenClass);
    }
    if (reblogUuid !== muteExcludedUuid && ['all', 'reblogged'].includes(mutedBlogs[reblogUuid]?.[1])) {
      postElement.classList.add(hiddenClass);
    }
  });
};

const onMeatballButtonClicked = function ({ currentTarget }) {
  const { blog: { name, uuid } } = currentTarget.__timelineObjectData;

  const currentMode = mutedBlogs[uuid]?.[1];

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

  mutedBlogs[uuid] = [name, value];
  browser.storage.local.set({ [storageKey]: mutedBlogs });

  hideModal();
};

const unmuteUser = uuid => {
  delete mutedBlogs[uuid];
  browser.storage.local.set({ [storageKey]: mutedBlogs });

  hideModal();
};

export const onStorageChanged = async function (changes, areaName) {
  const { [storageKey]: mutedBlogsChanges } = changes;

  if (mutedBlogsChanges) {
    ({ newValue: mutedBlogs } = mutedBlogsChanges);

    $(`.${hiddenClass}`).removeClass(hiddenClass);
    $(`.${warningClass}`).remove();
    $('[data-mute-processed-timeline]').removeAttr('data-mute-processed-timeline');
    $('[data-mute-excluded-uuid]').removeAttr('data-mute-excluded-uuid');
    pageModifications.trigger(processPosts);
  }
};

export const main = async function () {
  ({ [storageKey]: mutedBlogs = {} } = await browser.storage.local.get(storageKey));

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
  $(`.${activeClass}`).removeClass(activeClass);
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${warningClass}`).remove();
  $('[data-mute-processed-timeline]').removeAttr('data-mute-processed-timeline');
  $('[data-mute-excluded-uuid]').removeAttr('data-mute-excluded-uuid');

  dismissedWarningUuids.clear();
};

export const stylesheet = true;
