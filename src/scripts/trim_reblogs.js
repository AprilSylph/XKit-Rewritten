import { createControlButtonTemplate, cloneControlButton } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { getPostElements } from '../util/interface.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { timelineObject, timelineObjectMemoized } from '../util/react_props.js';
import { apiFetch } from '../util/tumblr_helpers.js';

const symbolId = 'ri-scissors-cut-line';
const buttonClass = 'xkit-trim-reblogs-button';
const excludeClass = 'xkit-trim-reblogs-done';

let reblogSelector;

let controlButtonTemplate;

const onButtonClicked = async function ({ currentTarget }) {
  const postElement = currentTarget.closest('[data-id]');
  const postId = postElement.dataset.id;

  const {
    blog: { uuid },
    rebloggedRootUuid,
    rebloggedRootId
  } = await timelineObjectMemoized(postId);

  if (rebloggedRootUuid && rebloggedRootId) {
    const { response: { shouldOpenInLegacy } } = await apiFetch(`/v2/blog/${rebloggedRootUuid}/posts/${rebloggedRootId}`);
    if (shouldOpenInLegacy) {
      notify('Legacy posts cannot be trimmed.');
      return;
    }
  }

  const {
    response: {
      content = {},
      date,
      hide_trail: hideTrail = false,
      layout,
      placement_id: placementId = '',
      slug = '',
      state = 'published',
      tags = [],
      trail = []
    }
  } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`);

  if (trail?.length < 2 || hideTrail) {
    notify('This post is too short to trim!');
    return;
  }

  const excludeTrailItems = [];

  for (const [index] of trail.entries()) {
    excludeTrailItems.push(index);
  }

  excludeTrailItems.pop();

  showModal({
    title: 'Trim this post?',
    message: [
      'All but the last trail item will be removed.'
    ],
    buttons: [
      modalCancelButton,
      Object.assign(document.createElement('button'), {
        textContent: 'Trim!',
        className: 'blue',
        onclick: async () => {
          hideModal();

          try {
            const { response: { displayText } } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`, {
              method: 'PUT',
              body: {
                content,
                date,
                exclude_trail_items: excludeTrailItems,
                hide_trail: hideTrail,
                layout,
                placement_id: placementId,
                slug,
                state,
                tags: tags.join(',')
              }
            });
            notify(displayText);

            currentTarget.remove();

            const reblogs = [...postElement.querySelectorAll(reblogSelector)];
            excludeTrailItems
              .map(i => reblogs[i])
              .forEach(reblog => reblog.remove());
          } catch ({ body }) {
            notify(body.errors[0].detail);
          }
        }
      })
    ]
  });
};

const processPosts = async function () {
  getPostElements({ excludeClass }).forEach(async postElement => {
    const editButton = postElement.querySelector('footer a[href*="/edit/"]');
    if (!editButton) { return; }

    const { trail = [] } = await timelineObject(postElement.dataset.id);
    if (trail.length < 2) { return; }

    const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: onButtonClicked });
    editButton.parentNode.parentNode.insertBefore(clonedControlButton, editButton.parentNode);
  });
};

export const main = async function () {
  reblogSelector = await keyToCss('reblog');
  controlButtonTemplate = await createControlButtonTemplate(symbolId, buttonClass);

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
};
