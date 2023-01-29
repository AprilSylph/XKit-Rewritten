import { createControlButtonTemplate, cloneControlButton } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { filterPostElements, postSelector } from '../util/interface.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { onNewPosts, pageModifications } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { timelineObject } from '../util/react_props.js';
import { buildSvg } from '../util/remixicon.js';
import { apiFetch, createEditRequestBody } from '../util/tumblr_helpers.js';

const symbolId = 'ri-scissors-cut-line';
const buttonClass = 'xkit-trim-reblogs-button';
const reblogPreviewClass = 'xkit-trim-reblogs-preview';
const avatarPreviewClass = 'xkit-trim-reblogs-avatar-preview';
const textPreviewClass = 'xkit-trim-reblogs-text-preview';

const controlIconSelector = keyToCss('controlIcon');
const reblogSelector = keyToCss('reblog');

let controlButtonTemplate;

const blogPlaceholder = {
  avatar: [{ url: 'https://assets.tumblr.com/pop/src/assets/images/avatar/anonymous_avatar_96-223fabe0.png' }],
  name: 'anonymous'
};

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
        await new Promise(resolve => {
          showModal({
            title: 'Note: Legacy post',
            message: [
              'The root post of this thread was originally created with the legacy post editor.',
              '\n\n',
              'On these threads, Trim Reblogs may work normally, have no effect, or require a repeat of the trim action to completely remove the desired trail items.'
            ],
            buttons: [
              modalCancelButton,
              dom('button', { class: 'blue' }, { click: () => resolve() }, ['Continue'])
            ]
          });
        });
      }
      unsureOfLegacyStatus = false;
    } catch (exception) {
      unsureOfLegacyStatus = true;
    }
  }

  const { response: postData } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}?fields[blogs]=name,avatar`);
  const { blog, content = [], trail = [] } = postData;

  if (!trail?.length) {
    notify('This post is too short to trim!');
    return;
  }

  const createPreviewItem = ({ blog, brokenBlog, content, disableCheckbox = false }) => {
    const { avatar, name } = blog ?? brokenBlog ?? blogPlaceholder;
    const { url: src } = avatar[avatar.length - 1];
    const textContent = content.map(({ text }) => text).find(Boolean) ?? '\u22EF';

    const checkbox = dom('input', { type: 'checkbox' });
    if (disableCheckbox) {
      checkbox.disabled = true;
      checkbox.style = 'visibility: hidden';
    }

    const wrapper = dom('label', null, null, [
      checkbox,
      dom('img', { class: avatarPreviewClass, src }),
      dom('div', { class: textPreviewClass }, null, [
        dom('strong', null, null, [name]),
        dom('p', null, null, [textContent])
      ])
    ]);

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
          ...createEditRequestBody(postData),
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
      const nothingSelected = trailData.every(({ checkbox }) => !checkbox.checked);
      const postWillBeEmpty = trailData.every(({ checkbox }) => checkbox.checked) && !content.length;
      trimButton.disabled = nothingSelected || postWillBeEmpty;
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

const showEditorInfo = async ([avatarWrapper]) => {
  const info = dom('div', { class: 'xkit-trim-reblogs-editor-info' }, null, [
    buildSvg(symbolId),
      `Looking for Trim Reblogs? Draft or publish your reblog with your addition, then click the
        scissors button on the resulting post!`
  ]);
  const infoWrapper = dom('div', { class: 'xkit-trim-reblogs-editor-info-wrapper' }, null, [info]);
  avatarWrapper.after(infoWrapper);
};

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass);
  onNewPosts.addListener(processPosts);
  pageModifications.register(
    `${keyToCss('postContainer')} ${keyToCss('avatarWrapper')}${keyToCss('sticky')}`,
    showEditorInfo
  );
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  $(`.${buttonClass}`).remove();
};

export const stylesheet = true;
