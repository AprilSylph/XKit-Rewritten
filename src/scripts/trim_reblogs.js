import { createControlButtonTemplate, cloneControlButton } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { filterPostElements, postSelector } from '../util/interface.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { timelineObject } from '../util/react_props.js';
import { apiFetch } from '../util/tumblr_helpers.js';

const symbolId = 'ri-scissors-cut-line';
const buttonClass = 'xkit-trim-reblogs-button';
const reblogPreviewClass = 'xkit-trim-reblogs-preview';
const avatarPreviewClass = 'xkit-trim-reblogs-avatar-preview';
const textPreviewClass = 'xkit-trim-reblogs-text-preview';

const controlIconSelector = keyToCss('controlIcon');
const reblogSelector = keyToCss('reblog');

let controlButtonTemplate;

const onButtonClicked = async function ({ currentTarget: controlButton }) {
  const postElement = controlButton.closest(postSelector);
  const postId = postElement.dataset.id;

  const {
    blog: { uuid },
    rebloggedRootUuid,
    rebloggedRootId
  } = await timelineObject(postElement);

  let unsureOfLegacyStatus;

  if (rebloggedRootUuid && rebloggedRootId) {
    try {
      const { response: { shouldOpenInLegacy } } = await apiFetch(`/v2/blog/${rebloggedRootUuid}/posts/${rebloggedRootId}`);
      if (shouldOpenInLegacy) {
        notify('Legacy posts cannot be trimmed.');
        return;
      }
      unsureOfLegacyStatus = false;
    } catch (exception) {
      unsureOfLegacyStatus = true;
    }
  }

  const {
    response: {
      blog,
      content = [],
      layout,
      state = 'published',
      publishOn,
      date,
      tags = [],
      slug = '',
      trail = []
    }
  } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}?fields[blogs]=name,avatar`);

  if (trail?.length < 2) {
    notify('This post is too short to trim!');
    return;
  }

  const defaultKeep = 1;
  const min = 1;
  const max = trail.length - 1;

  const previewData = [...trail];
  if (Object.entries(content).length) previewData.push({ blog, content });

  const previewElements = previewData.map(({ blog: { avatar }, content }) => {
    const { url } = avatar[avatar.length - 1];
    const text = content.map(({ text }) => text).filter(Boolean).join(' / ');
    return dom('div', {}, {}, [
      dom('div', { class: avatarPreviewClass, style: `background-image: url(${url})` }),
      dom('div', { class: textPreviewClass }, {}, [text])
    ]);
  });
  const previewElement = dom('div', { class: reblogPreviewClass });
  previewElement.append(...previewElements);

  const inputElement = dom('input', {
    type: 'number',
    name: 'keepItems',
    value: defaultKeep,
    min,
    max,
    required: true,
    style: 'width: 20ch' // becomes tiny in chromium if not hard coded
  });

  let excludeTrailItems = [];

  const updateExcluded = () => {
    if (inputElement.matches(':valid')) {
      const keptItems = parseInt(inputElement.value, 10);
      if (isNaN(keptItems) || keptItems > max || keptItems < min) {
        throw new Error(`Invalid kept items value: ${inputElement.value}`);
      }
      excludeTrailItems = [...trail.keys()].slice(0, -keptItems);

      previewElements.forEach((element, i) => {
        element.dataset.excluded = excludeTrailItems.includes(i);
      });
    }
  };
  inputElement.addEventListener('input', updateExcluded);
  updateExcluded();

  const confirmTrim = async event => {
    event.preventDefault();
    hideModal();

    try {
      const { response: { displayText } } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`, {
        method: 'PUT',
        body: {
          content,
          layout,
          state,
          publish_on: publishOn,
          date,
          tags: tags.join(','),
          slug,
          exclude_trail_items: excludeTrailItems
        }
      });
      notify(displayText);

      controlButton.remove();

      const reblogs = [...postElement.querySelectorAll(reblogSelector)];
      excludeTrailItems
        .map(i => reblogs[i])
        .forEach(reblog => reblog.remove());
    } catch ({ body }) {
      notify(body.errors[0].detail);
    }
  };

  const form = dom('form', { id: 'xkit-trim-reblogs-form' }, { submit: confirmTrim }, [
    dom('label', null, null, ['Keep this many trail items:', inputElement])
  ]);

  showModal({
    title: 'Trim this post?',
    message: [
      form,
      previewElement,
      ...(unsureOfLegacyStatus
        ? ['\n\n', "Warning: XKit can't tell if this post originated from the legacy post editor. Trimming may fail if so."]
        : [])
    ],
    buttons: [
      modalCancelButton,
      dom('input', { type: 'submit', form: form.id, class: 'blue', value: 'Trim!' })
    ]
  });
};

const processPosts = postElements => filterPostElements(postElements).forEach(async postElement => {
  const existingButton = postElement.querySelector(`.${buttonClass}`);
  if (existingButton !== null) { return; }

  const editButton = postElement.querySelector(`footer ${controlIconSelector} a[href*="/edit/"]`);
  if (!editButton) { return; }

  const { trail = [] } = await timelineObject(postElement);
  if (trail.length < 2) { return; }

  const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: onButtonClicked });
  const controlIcon = editButton.closest(controlIconSelector);
  controlIcon.before(clonedControlButton);
});

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass);
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  $(`.${buttonClass}`).remove();
};

export const stylesheet = true;
