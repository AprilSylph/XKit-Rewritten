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

  if (!trail?.length) {
    notify('This post is too short to trim!');
    return;
  }

  const createPreviewItem = ({ blog: { avatar }, content, disableCheckbox = false }) => {
    const { url } = avatar[avatar.length - 1];
    const contentTextStrings = content.map(({ text }) => text).filter(Boolean).slice(0, 4);

    const checkbox = dom('input', { type: 'checkbox' });
    if (disableCheckbox) {
      checkbox.disabled = true;
      checkbox.style = 'visibility: hidden';
    }

    const avatarElement = dom('div', { class: avatarPreviewClass, style: `background-image: url(${url})` });
    const textElement = dom(
      'div',
      { style: 'overflow-x: hidden;' },
      null,
      contentTextStrings.map(text => dom('div', { class: textPreviewClass }, null, [text]))
    );
    const wrapper = dom('div', null, null, [checkbox, avatarElement, textElement]);
    return { wrapper, checkbox };
  };

  const trailData = trail.map(createPreviewItem);
  trailData.slice(0, -1).forEach(({ checkbox }) => { checkbox.checked = true; });

  const contentData = content.length
    ? [createPreviewItem({ blog, content, disableCheckbox: true })]
    : [];

  const previewElement = dom(
    'div',
    { class: reblogPreviewClass },
    null,
    [...trailData, ...contentData].map(({ wrapper }) => wrapper)
  );

  const onClickTrim = async () => {
    hideModal();

    const excludeTrailItems = [...trailData.keys()]
      .filter(i => trailData[i].checkbox.checked);

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

  const trimButton = dom('button', { class: 'blue' }, { click: onClickTrim }, ['Trim!']);

  trailData.forEach(({ checkbox }) => {
    checkbox.addEventListener('input', () => {
      trimButton.disabled = !trailData.some(({ checkbox }) => checkbox.checked);
    });
  });

  showModal({
    title: 'Trim this post?',
    message: [
      'Select trail items to remove:',
      previewElement,
      ...(unsureOfLegacyStatus
        ? ['\n\n', "Warning: XKit can't tell if this post originated from the legacy post editor. Trimming may fail if so."]
        : [])
    ],
    buttons: [modalCancelButton, trimButton]
  });
};

const processPosts = postElements => filterPostElements(postElements).forEach(async postElement => {
  const existingButton = postElement.querySelector(`.${buttonClass}`);
  if (existingButton !== null) { return; }

  const editButton = postElement.querySelector(`footer ${controlIconSelector} a[href*="/edit/"]`);
  if (!editButton) { return; }

  const { trail = [] } = await timelineObject(postElement);
  if (!trail.length) { return; }

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
