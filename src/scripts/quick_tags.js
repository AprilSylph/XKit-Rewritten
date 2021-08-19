import { cloneControlButton, createControlButtonTemplate } from '../util/control_buttons.js';
import { getPostElements } from '../util/interface.js';
import { onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { registerPostOption, unregisterPostOption } from '../util/post_actions.js';
import { timelineObjectMemoized, editPostFormTags } from '../util/react_props.js';
import { apiFetch } from '../util/tumblr_helpers.js';

const iconClass = 'ri-price-tag-3-line';
const buttonClass = 'xkit-quick-tags-button';
const excludeClass = 'xkit-quick-tags-done';
const tagsClass = 'xkit-quick-tags-tags';

const popupElement = Object.assign(document.createElement('div'), { id: 'quick-tags' });
const postOptionPopupElement = Object.assign(document.createElement('div'), { id: 'quick-tags-post-option' });

let controlButtonTemplate;

const storageKey = 'quick_tags.preferences.tagBundles';

const populatePopups = async function () {
  popupElement.textContent = '';
  postOptionPopupElement.textContent = '';

  const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);
  for (const tagBundle of tagBundles) {
    const bundleButton = document.createElement('button');
    bundleButton.textContent = tagBundle.title;
    bundleButton.dataset.tags = tagBundle.tags;
    popupElement.appendChild(bundleButton);

    postOptionPopupElement.appendChild(bundleButton.cloneNode(true));
  }
};

export const onStorageChanged = async function (changes, areaName) {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    populatePopups();
  }
};

const togglePopupDisplay = async function ({ target, currentTarget }) {
  if (target === popupElement || popupElement.contains(target)) { return; }

  const appendOrRemove = currentTarget.contains(popupElement) ? 'removeChild' : 'appendChild';
  currentTarget[appendOrRemove](popupElement);
};

const togglePostOptionPopupDisplay = async function ({ target, currentTarget }) {
  if (target === postOptionPopupElement || postOptionPopupElement.contains(target)) { return; }

  const appendOrRemove = currentTarget.contains(postOptionPopupElement) ? 'removeChild' : 'appendChild';
  currentTarget[appendOrRemove](postOptionPopupElement);
};

const processBundleClick = async function ({ target }) {
  if (target.tagName !== 'BUTTON') { return; }
  const bundleTags = target.dataset.tags.split(',').map(bundleTag => bundleTag.trim());

  const postElement = target.closest('[data-id]');
  popupElement.parentNode.removeChild(popupElement);

  const postId = postElement.dataset.id;
  const { blog: { uuid } } = await timelineObjectMemoized(postId);

  const {
    response: {
      content = {},
      date,
      hide_trail: hideTrail = false,
      layout,
      placement_id: placementId = '',
      slug = '',
      state = 'published',
      tags = []
    }
  } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`);

  const tagsToAdd = bundleTags.filter(bundleTag => tags.includes(bundleTag) === false);
  if (tagsToAdd.length === 0) { return; }

  tags.push(...tagsToAdd);

  try {
    const { response: { displayText } } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`, {
      method: 'PUT',
      body: {
        content,
        date,
        hide_trail: hideTrail,
        layout,
        placement_id: placementId,
        slug,
        state,
        tags: tags.join(',')
      }
    });

    notify(displayText);

    const tagsElement = Object.assign(document.createElement('div'), { className: tagsClass });

    const innerTagsDiv = document.createElement('div');
    tagsElement.appendChild(innerTagsDiv);

    for (const tag of tags) {
      innerTagsDiv.appendChild(Object.assign(document.createElement('a'), {
        textContent: `#${tag}`,
        href: `/tagged/${encodeURIComponent(tag)}`,
        target: '_blank'
      }));
    }

    postElement.querySelector('footer').parentNode.prepend(tagsElement);
  } catch ({ body }) {
    notify(body.errors[0].detail);
  }
};

const processPostOptionBundleClick = function ({ target }) {
  if (target.tagName !== 'BUTTON') { return; }
  const bundleTags = target.dataset.tags.split(',').map(bundleTag => bundleTag.trim());

  editPostFormTags({ add: bundleTags });
};

const processPosts = async function () {
  getPostElements({ excludeClass }).forEach(async postElement => {
    const editButton = postElement.querySelector('footer a[href*="/edit/"]');
    if (!editButton) { return; }

    const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: togglePopupDisplay });
    editButton.parentNode.parentNode.insertBefore(clonedControlButton, editButton.parentNode);
  });
};

export const main = async function () {
  controlButtonTemplate = await createControlButtonTemplate(iconClass, buttonClass);

  onNewPosts.addListener(processPosts);
  processPosts();

  registerPostOption('quick-tags', { iconClass, onclick: togglePostOptionPopupDisplay });

  populatePopups();

  popupElement.addEventListener('click', processBundleClick);
  postOptionPopupElement.addEventListener('click', processPostOptionBundleClick);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  popupElement.parentNode?.removeChild(popupElement);

  unregisterPostOption('quick-tags');

  $(`.${buttonClass}`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${tagsClass}`).remove();
};

export const stylesheet = true;
