import { filterPostElements, blogViewSelector, buildStyle } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { timelineObject } from '../util/react_props.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';

const meatballButtonId = 'mute';
const meatballButtonLabel = 'Mute options';

const warningClass = 'xkit-mute-warning';
const lengthenedClass = 'xkit-mute-lengthened';
const controlsClass = 'xkit-mute-controls';

const storageKey = 'mute.mutedblogs';

let mutedBlogs = {};
const dismissedWarningUuids = new Set();

const styleElement = buildStyle();

const buildPostSelector = excludedUuid => {
  const selectors = [];
  Object.entries(mutedBlogs).forEach(([uuid, [name, mode]]) => {
    if (uuid === excludedUuid) return;

    if (['all', 'original'].includes(mode)) {
      selectors.push(`[data-xkit-mute-original-uuid="${uuid}"]`);
    }
    if (['all', 'reblogged'].includes(mode)) {
      selectors.push(`[data-xkit-mute-reblog-uuid="${uuid}"]`);
    }
  });
  return `:is(${selectors.join(', ')})`;
};

const updateStyleElement = () => {
  styleElement.textContent = '';
  styleElement.textContent += `
   [data-mute="on"] + [data-timeline] ${buildPostSelector()} article {
      /* display: none; */
      opacity: 0.5;
    }
  `;
  dismissedWarningUuids.forEach(uuid => {
    styleElement.textContent += `
      [data-mute="except ${uuid}"] + [data-timeline] ${buildPostSelector(uuid)} article {
        /* display: none; */
        opacity: 0.5;
      }
   `;
  });
};

const lengthenTimeline = timeline => {
  if (!timeline.querySelector(keyToCss('manualPaginatorButtons'))) {
    timeline.classList.add(lengthenedClass);
  }
};

const addControls = (timelineElement, timeline) => {
  const isSingleBlog = timeline.startsWith('/v2/blog/');
  const isInBlogView = timelineElement.matches(blogViewSelector);
  const isChannel = isSingleBlog === true && isInBlogView === false;

  const controls = dom('div', { class: controlsClass });
  controls.dataset.forTimeline = timeline;
  controls.dataset.mute = 'on';
  timelineElement.before(controls);

  if (isChannel) {
    controls.dataset.mute = 'off';
    return;
  }

  // TODO: more reliable check if current blog is muted (currently susceptible to stored outdated blognames)
  const mutedBlogEntry = Object.entries(mutedBlogs).find(
    ([uuid, [name]]) =>
      timeline.startsWith(`/v2/blog/${uuid}/`) || timeline.startsWith(`/v2/blog/${name}/`)
  );

  if (mutedBlogEntry) {
    const [uuid, [name, mode]] = mutedBlogEntry;

    if (mode === 'all') {
      controls.dataset.mute = `except ${uuid}`;

      if (!dismissedWarningUuids.has(uuid)) {
        const dismissWarning = () => {
          dismissedWarningUuids.add(uuid);
          updateStyleElement();

          controls.classList.remove(warningClass);
          controls.replaceChildren([]);
        };

        controls.classList.add(warningClass);
        controls.replaceChildren(...[
          `You have muted all posts from ${name}!`,
          dom('br'),
          dom('button', null, { click: dismissWarning }, 'show posts anyway')
        ]);
      }
    }
  }
};

const processTimelines = () => {
  [...document.querySelectorAll('[data-timeline]')].forEach(timelineElement => {
    const timeline = timelineElement.dataset.timeline;

    const currentControls = timelineElement.previousElementSibling?.classList?.contains(controlsClass)
      ? timelineElement.previousElementSibling
      : null;

    if (currentControls?.dataset?.forTimeline !== timeline) {
      currentControls?.remove();
      addControls(timelineElement, timeline);
      lengthenTimeline(timelineElement);
    }
  });
};

const processPosts = function (postElements) {
  processTimelines();

  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const { blog: { uuid }, rebloggedRootUuid, content } = await timelineObject(postElement);

    // should there be a setting such that reblogs with contributed content count?
    // eslint-disable-next-line no-unused-vars
    const contributedContent = content.length > 0;
    const isRebloggedPost = Boolean(rebloggedRootUuid);

    if (isRebloggedPost) {
      postElement.dataset.xkitMuteReblogUuid = uuid;
      postElement.dataset.xkitMuteOriginalUuid = rebloggedRootUuid;
    } else {
      postElement.dataset.xkitMuteOriginalUuid = uuid;
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

    $(`.${controlsClass}`).remove();
    processTimelines();
    updateStyleElement();
  }
};

export const main = async function () {
  ({ [storageKey]: mutedBlogs = {} } = await browser.storage.local.get(storageKey));

  updateStyleElement();
  document.head.append(styleElement);
  registerMeatballItem({
    id: meatballButtonId,
    label: meatballButtonLabel,
    onclick: onMeatballButtonClicked
  });
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  styleElement.remove();
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`.${lengthenedClass}`).removeClass(lengthenedClass);
  $(`.${controlsClass}`).remove();
  $('[data-xkit-mute-original-uuid]').removeAttr('data-xkit-mute-original-uuid');
  $('[data-xkit-mute-reblog-uuid]').removeAttr('data-xkit-mute-reblog-uuid');

  dismissedWarningUuids.clear();
};

export const stylesheet = true;
