import { createControlButtonTemplate, cloneControlButton, insertControlButton } from '../../utils/control_buttons.js';
import { keyToCss } from '../../utils/css_map.js';
import { button, div, img, input, label, p, strong } from '../../utils/dom.js';
import { filterPostElements, postSelector } from '../../utils/interface.js';
import { showModal, hideModal, modalCancelButton, showErrorModal } from '../../utils/modals.js';
import { onNewPosts } from '../../utils/mutations.js';
import { notify } from '../../utils/notifications.js';
import { timelineObject } from '../../utils/react_props.js';
import { apiFetch, createEditRequestBody } from '../../utils/tumblr_helpers.js';

const symbolId = 'ri-scissors-cut-line';
const buttonClass = 'xkit-trim-reblogs-button';
const reblogPreviewClass = 'xkit-trim-reblogs-preview';
const avatarPreviewClass = 'xkit-trim-reblogs-avatar-preview';
const textPreviewClass = 'xkit-trim-reblogs-text-preview';

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
    blog: { uuid }
  } = await timelineObject(postElement);

  const { response: postData } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}?fields[blogs]=name,avatar`);
  const { blog, authorBlog, community, content = [], trail = [], isBlocksPostFormat } = postData;
  const visibleBlog = community ? authorBlog : blog;

  if (isBlocksPostFormat === false) {
    await new Promise(resolve => {
      showModal({
        title: 'Note: Legacy post',
        message: [
          'This thread was originally created, or at some point was edited, using the ',
          strong({}, ['legacy post editor']),
          ' or a previous XKit version.',
          '\n\n',
          'On these threads, Trim Reblogs may work normally, have no effect, or require a repeat of the trim action to completely remove the desired trail items.'
        ],
        buttons: [
          modalCancelButton,
          button({ class: 'blue', click: resolve }, ['Continue'])
        ]
      });
    });
  }

  if (trail.some(({ layout = [] }) => layout.some(({ type }) => type === 'ask'))) {
    await new Promise(resolve => {
      showModal({
        title: '⚠️ This thread contains an ask!',
        message: [
          `Trimming an ask from a thread will result in it appearing broken on custom themes (i.e. ${blog?.name}.tumblr.com).`,
          '\n\n',
          'To avoid issues with custom themes, leave the ask intact when trimming.'
        ],
        buttons: [
          modalCancelButton,
          button({ class: 'blue', click: resolve }, ['Continue'])
        ]
      });
    });
  }

  const createPreviewItem = ({ blog, brokenBlog, content, disableCheckbox = false }) => {
    const { avatar, name } = blog ?? brokenBlog ?? blogPlaceholder;
    const { url: src } = avatar.at(-1);
    const textContent = content.map(({ text }) => text).find(Boolean) ?? '\u22EF';

    const checkbox = input({ type: 'checkbox' });
    if (disableCheckbox) {
      checkbox.disabled = true;
      checkbox.style = 'visibility: hidden';
    }

    const wrapper = label({}, [
      checkbox,
      img({ class: avatarPreviewClass, src }),
      div({ class: textPreviewClass }, [
        strong({}, [name]),
        p({}, [textContent])
      ])
    ]);

    return { wrapper, checkbox };
  };

  const trailData = trail.map(createPreviewItem);
  trailData.slice(0, -1).forEach(({ checkbox }) => { checkbox.checked = true; });

  const contentData = content.length
    ? [createPreviewItem({ blog: visibleBlog, content, disableCheckbox: true })]
    : [];

  const previewElement = div(
    { class: reblogPreviewClass },
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

      controlButton.closest('.xkit-control-button-container').remove();

      const reblogs = [...postElement.querySelectorAll(reblogSelector)];
      excludeTrailItems
        .map(i => reblogs[i])
        .forEach(reblog => reblog.remove());
    } catch (exception) {
      showErrorModal(exception);
    }
  };

  const trimButton = button({ class: 'blue', click: onClickTrim }, ['Trim!']);

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
      previewElement
    ],
    buttons: [modalCancelButton, trimButton]
  });
};

const processPosts = postElements => filterPostElements(postElements).forEach(async postElement => {
  const { state, canEdit, trail = [], content = [] } = await timelineObject(postElement);
  const items = trail.length + (content.length ? 1 : 0);

  if (canEdit && ['ask', 'submission'].includes(state) === false) {
    const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: event => onButtonClicked(event).catch(showErrorModal) }, items < 2);
    insertControlButton(postElement, clonedControlButton, buttonClass);
  }
});

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass, 'Trim Reblogs');
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  $(`.${buttonClass}`).remove();
};

export const stylesheet = true;
