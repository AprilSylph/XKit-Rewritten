import { filterPostElements, blogViewSelector } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { timelineObject } from '../util/react_props.js';
import { onNewPosts, pageModifications } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';

const meatballButtonId = 'mute';
const meatballButtonLabel = 'Mute options';

const activeClass = 'xkit-mute-active';
const hiddenClass = 'xkit-mute-hidden';
const lengthenedClass = 'xkit-mute-lengthened';
const warningClass = 'xkit-mute-warning';

const storageKey = 'mute.mutedblogs';

let mutedBlogs = {};

const lengthenTimeline = async (timeline) => {
  if (!timeline.querySelector(keyToCss('manualPaginatorButtons'))) {
    timeline.classList.add(lengthenedClass);
  }
};

const updateWarningElement = (timelineElement, timeline) => {
  if (timelineElement.dataset.xkitRemovedTimelineWarning === timeline) return;

  const currentWarningElement = timelineElement.previousElementSibling?.classList?.contains(warningClass)
    ? timelineElement.previousElementSibling
    : null;

  if (currentWarningElement) {
    if (currentWarningElement.dataset.cachedTimeline === timeline) {
      return;
    } else {
      currentWarningElement.remove();
    }
  }
  // TODO: more reliable check if current blog is muted (currently susceptible to stored outdated blognames)
  const currentBlogUuidOrName = timeline.split('/')[3];
  const mutedBlogEntry = Object.entries(mutedBlogs).find(([uuid, [name]]) => uuid === currentBlogUuidOrName || name === currentBlogUuidOrName);

  if (mutedBlogEntry) {
    const [, [name]] = mutedBlogEntry;
    const warningElement = dom('div', { class: warningClass }, null, [
      `You have muted ${name}!`,
      dom('br'),
      dom(
        'button',
        null,
        { click: () => { warningElement.remove(); timelineElement.dataset.xkitRemovedTimelineWarning = timeline; } },
        'show posts anyway'
      )
    ]);
    warningElement.dataset.cachedTimeline = timeline;
    timelineElement.before(warningElement);
  }
};

const processTimelines = async () => {
  [...document.querySelectorAll('[data-timeline]')].forEach(async timelineElement => {
    const timeline = timelineElement.dataset.timeline;
    const isSingleBlog = timeline.startsWith('/v2/blog/');
    const isInBlogView = timelineElement.matches(blogViewSelector);
    const isChannel = isSingleBlog === true && isInBlogView === false;

    console.log({ timelineElement, timeline, isBlogView: isSingleBlog, isInBlogView, isChannel });

    if (isChannel) return;

    if (isInBlogView && timelineElement.closest(keyToCss('moreContent')) === null) {
      updateWarningElement(timelineElement, timeline);
    }

    lengthenTimeline(timelineElement);
    timelineElement.classList.add(activeClass);
  });
};

const processPosts = async function (postElements) {
  processTimelines();

  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    // eslint-disable-next-line prefer-const
    let { blog: { name, uuid }, rebloggedRootName, rebloggedRootUuid, content } = await timelineObject(postElement);

    // should there be a setting such that reblogs with contributed content count?
    // eslint-disable-next-line no-unused-vars
    const contributedContent = content.length > 0;
    const isRebloggedPost = Boolean(rebloggedRootUuid);

    // don't hide based on currently viewed blog if warning is dismissed; still mute others
    const currentTimeline = postElement.closest('[data-timeline]').dataset.timeline;
    if (currentTimeline.startsWith(`/v2/blog/${name}/`) || currentTimeline.startsWith(`/v2/blog/${uuid}/`)) uuid = undefined;
    if (currentTimeline.startsWith(`/v2/blog/${rebloggedRootName}/`) || currentTimeline.startsWith(`/v2/blog/${rebloggedRootUuid}/`)) rebloggedRootUuid = undefined;

    const blogMode = mutedBlogs[uuid]?.[1];
    const rootMode = mutedBlogs[rebloggedRootUuid]?.[1];

    if (isRebloggedPost) {
      if (['all', 'reblogged'].includes(blogMode) || ['all', 'original'].includes(rootMode)) {
        postElement.classList.add(hiddenClass);
      }
    } else {
      if (['all', 'original'].includes(blogMode)) {
        postElement.classList.add(hiddenClass);
      }
    }
  });
};

const onButtonClicked = async function ({ currentTarget }) {
  const { blog: { name, uuid } } = currentTarget.__timelineObjectData;

  const currentMode = mutedBlogs[uuid]?.[1];

  const createRadioElement = (value) =>
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
    // clean up warnings and data attributes from updateWarningElement

    pageModifications.trigger(processPosts);
  }
};

export const main = async function () {
  ({ [storageKey]: mutedBlogs = {} } = await browser.storage.local.get(storageKey));

  registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`.${activeClass}`).removeClass(activeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${warningClass}`).remove();

  // clean up data attributes from updateWarningElement
};

export const stylesheet = true;
