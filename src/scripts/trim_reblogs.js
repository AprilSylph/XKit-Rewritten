import { remove } from '../util/cleanup.js';
import { createControlButtonTemplate, cloneControlButton } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { filterPostElements, postSelector } from '../util/interface.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { timelineObject } from '../util/react_props.js';
import { apiFetch } from '../util/tumblr_helpers.js';

const symbolId = 'ri-scissors-cut-line';
const buttonClass = 'xkit-trim-reblogs-button';

const controlIconSelector = keyToCss('controlIcon');
const reblogSelector = keyToCss('reblog');

let controlButtonTemplate;

const onButtonClicked = async function ({ currentTarget }) {
  const postElement = currentTarget.closest(postSelector);
  const postId = postElement.dataset.id;

  const {
    blog: { uuid },
    rebloggedRootUuid,
    rebloggedRootId
  } = await timelineObject(postElement);

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
      layout,
      state = 'published',
      publishOn,
      date,
      tags = [],
      slug = '',
      trail = []
    }
  } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`);

  if (trail?.length < 2) {
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
  remove(buttonClass);
};
