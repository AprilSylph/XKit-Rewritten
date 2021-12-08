import { cloneControlButton, createControlButtonTemplate } from '../util/control_buttons.js';
import { getPostElements } from '../util/interface.js';
import { onBaseContainerMutated, onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { registerPostOption, unregisterPostOption } from '../util/post_actions.js';
import { getPreferences } from '../util/preferences.js';
import { timelineObjectMemoized, editPostFormTags } from '../util/react_props.js';
import { apiFetch } from '../util/tumblr_helpers.js';

const symbolId = 'ri-price-tag-3-line';
const buttonClass = 'xkit-quick-tags-button';
const excludeClass = 'xkit-quick-tags-done';
const tagsClass = 'xkit-quick-tags-tags';

let originalPostTag;
let answerTag;
let autoTagAsker;

const popupElement = Object.assign(document.createElement('div'), { id: 'quick-tags' });
const popupForm = Object.assign(document.createElement('form'), {
  onsubmit: event => event.preventDefault()
});
const popupInput = Object.assign(document.createElement('input'), {
  placeholder: 'Tags (comma separated)',
  autocomplete: 'off',
  onkeydown: event => event.stopPropagation()
});
popupForm.appendChild(popupInput);

const postOptionPopupElement = Object.assign(document.createElement('div'), { id: 'quick-tags-post-option' });

let controlButtonTemplate;

const storageKey = 'quick_tags.preferences.tagBundles';

const populatePopups = async function () {
  popupElement.textContent = '';
  postOptionPopupElement.textContent = '';

  popupElement.appendChild(popupForm);

  const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);
  for (const tagBundle of tagBundles) {
    const bundleButton = document.createElement('button');
    bundleButton.textContent = tagBundle.title;
    bundleButton.dataset.tags = tagBundle.tags;
    popupElement.appendChild(bundleButton);

    postOptionPopupElement.appendChild(bundleButton.cloneNode(true));
  }
};

const processPostForm = async function () {
  const selectedTagsElement = document.getElementById('selected-tags');
  if (selectedTagsElement === null || selectedTagsElement.classList.contains(excludeClass)) {
    return;
  } else {
    selectedTagsElement.classList.add(excludeClass);
  }

  if (originalPostTag && location.pathname.startsWith('/new')) {
    editPostFormTags({
      add: originalPostTag.split(',').map(tag => tag.trim())
    });
  } else if ((answerTag || autoTagAsker) && location.pathname.startsWith('/edit')) {
    const postId = location.pathname.split('/')[3];
    const { state, askingName } = await timelineObjectMemoized(postId);
    if (state === 'submission') {
      const tagsToAdd = [];
      if (answerTag) tagsToAdd.push(...answerTag.split(','));
      if (autoTagAsker && askingName) tagsToAdd.push(askingName);
      editPostFormTags({ add: tagsToAdd });
    }
  }
};

export const onStorageChanged = async function (changes, areaName) {
  if (areaName === 'local' && Object.keys(changes).some(key => key.startsWith('quick_tags'))) {
    if (Object.keys(changes).includes(storageKey)) populatePopups();

    ({ originalPostTag, answerTag, autoTagAsker } = await getPreferences('quick_tags'));
    if (originalPostTag || answerTag || autoTagAsker) {
      onBaseContainerMutated.addListener(processPostForm);
      processPostForm();
    } else {
      onBaseContainerMutated.removeListener(processPostForm);
    }
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

const addTagsToPost = async function ({ postElement, inputTags = [] }) {
  const postId = postElement.dataset.id;
  const { blog: { uuid } } = await timelineObjectMemoized(postId);

  const {
    response: {
      content = {},
      layout,
      state = 'published',
      publishOn,
      date,
      tags = [],
      sourceUrlRaw,
      slug = ''
    }
  } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`);

  const tagsToAdd = inputTags.filter(inputTag => tags.includes(inputTag) === false);
  if (tagsToAdd.length === 0) { return; }

  tags.push(...tagsToAdd);

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
        source_url: sourceUrlRaw,
        slug
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

const processFormSubmit = function ({ currentTarget }) {
  const postElement = currentTarget.closest('[data-id]');
  const inputTags = popupInput.value.split(',').map(inputTag => inputTag.trim());

  addTagsToPost({ postElement, inputTags });
  currentTarget.reset();
};

const processBundleClick = function ({ target }) {
  if (target.tagName !== 'BUTTON') { return; }

  const postElement = target.closest('[data-id]');
  const inputTags = target.dataset.tags.split(',').map(inputTag => inputTag.trim());

  addTagsToPost({ postElement, inputTags });
  popupElement.remove();
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

popupElement.addEventListener('click', processBundleClick);
popupForm.addEventListener('submit', processFormSubmit);
postOptionPopupElement.addEventListener('click', processPostOptionBundleClick);

export const main = async function () {
  controlButtonTemplate = await createControlButtonTemplate(symbolId, buttonClass);

  onNewPosts.addListener(processPosts);
  processPosts();

  registerPostOption('quick-tags', { symbolId, onclick: togglePostOptionPopupDisplay });

  populatePopups();

  ({ originalPostTag, answerTag, autoTagAsker } = await getPreferences('quick_tags'));
  if (originalPostTag || answerTag || autoTagAsker) {
    onBaseContainerMutated.addListener(processPostForm);
    processPostForm();
  }
};

export const clean = async function () {
  onBaseContainerMutated.removeListener(processPostForm);
  onNewPosts.removeListener(processPosts);
  popupElement.remove();

  unregisterPostOption('quick-tags');

  $(`.${buttonClass}`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${tagsClass}`).remove();
};

export const stylesheet = true;
