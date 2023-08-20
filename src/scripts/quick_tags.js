import { cloneControlButton, createControlButtonTemplate } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { postSelector } from '../util/interface.js';
import { megaEdit } from '../util/mega_editor.js';
import { pageModifications } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { registerPostOption, unregisterPostOption } from '../util/post_actions.js';
import { getPreferences } from '../util/preferences.js';
import { timelineObject, editPostFormTags } from '../util/react_props.js';
import { apiFetch, createEditRequestBody, isNpfCompatible } from '../util/tumblr_helpers.js';

const symbolId = 'ri-price-tag-3-line';
const buttonClass = 'xkit-quick-tags-button';
const excludeClass = 'xkit-quick-tags-done';
const tagsClass = 'xkit-quick-tags-tags';
const controlIconSelector = keyToCss('controlIcon');

let originalPostTag;
let answerTag;
let autoTagAsker;

let controlButtonTemplate;

const popupElement = dom('div', { id: 'quick-tags' });
const popupForm = dom('form', null, { submit: event => event.preventDefault() });
const popupInput = dom(
  'input',
  {
    placeholder: 'Tags (comma separated)',
    autocomplete: 'off'
  },
  { keydown: event => event.stopPropagation() }
);
const doSmartQuotes = ({ currentTarget }) => {
  const { value } = currentTarget;
  currentTarget.value = value
    .replace(/^"/, '\u201C')
    .replace(/ "/g, ' \u201C')
    .replace(/"/g, '\u201D');
};
popupInput.addEventListener('input', doSmartQuotes);
const checkLength = ({ currentTarget }) => {
  const { value } = currentTarget;
  const tags = value.split(',').map(tag => tag.trim());
  if (tags.some(tag => tag.length > 140)) {
    popupInput.setCustomValidity('Tag is longer than 140 characters!');
    popupInput.reportValidity();
  } else {
    popupInput.setCustomValidity('');
  }
};
popupInput.addEventListener('input', checkLength);
popupForm.appendChild(popupInput);

const postOptionPopupElement = dom('div', { id: 'quick-tags-post-option' });

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

const processPostForm = async function ([selectedTagsElement]) {
  if (selectedTagsElement.classList.contains(excludeClass)) {
    return;
  } else {
    selectedTagsElement.classList.add(excludeClass);
  }

  if (originalPostTag && location.pathname.startsWith('/new')) {
    editPostFormTags({
      add: originalPostTag.split(',').map(tag => tag.trim())
    });
  } else if ((answerTag || autoTagAsker) && location.pathname.startsWith('/edit')) {
    const [blogName, postId] = location.pathname.split('/').slice(2);
    const postOnScreen = document.querySelector(`[tabindex="-1"][data-id="${postId}"]`);

    const {
      response = {},
      state = response.state,
      askingName = response.askingName
    } = await (postOnScreen ? timelineObject(postOnScreen) : apiFetch(`/v2/blog/${blogName}/posts/${postId}`));

    if (state === 'submission') {
      const tagsToAdd = [];
      if (answerTag) tagsToAdd.push(...answerTag.split(','));
      if (autoTagAsker && askingName) tagsToAdd.push(askingName);
      editPostFormTags({ add: tagsToAdd });
    }
  }
};

export const onStorageChanged = async function (changes, areaName) {
  if (Object.keys(changes).some(key => key.startsWith('quick_tags'))) {
    if (Object.keys(changes).includes(storageKey)) populatePopups();

    ({ originalPostTag, answerTag, autoTagAsker } = await getPreferences('quick_tags'));
    if (originalPostTag || answerTag || autoTagAsker) {
      pageModifications.register('#selected-tags', processPostForm);
    } else {
      pageModifications.unregister(processPostForm);
    }
  }
};

const appendWithoutViewportOverflow = (element, target) => {
  element.className = 'below';
  target.appendChild(element);
  if (element.getBoundingClientRect().bottom > document.documentElement.clientHeight) {
    element.className = 'above';
  }
};

const togglePopupDisplay = async function ({ target, currentTarget: controlButton }) {
  if (target === popupElement || popupElement.contains(target)) { return; }

  const buttonContainer = controlButton.parentElement;

  if (buttonContainer.contains(popupElement)) {
    buttonContainer.removeChild(popupElement);
  } else {
    appendWithoutViewportOverflow(popupElement, buttonContainer);
  }
};

const togglePostOptionPopupDisplay = async function ({ target, currentTarget }) {
  if (target === postOptionPopupElement || postOptionPopupElement.contains(target)) { return; }

  if (currentTarget.contains(postOptionPopupElement)) {
    currentTarget.removeChild(postOptionPopupElement);
  } else {
    appendWithoutViewportOverflow(postOptionPopupElement, currentTarget);
  }
};

const addTagsToPost = async function ({ postElement, inputTags = [] }) {
  const postId = postElement.dataset.id;
  const { blog: { uuid }, blogName } = await timelineObject(postElement);

  const { response: postData } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`);
  const { tags = [] } = postData;

  const tagsToAdd = inputTags.filter(inputTag => tags.includes(inputTag) === false);
  if (tagsToAdd.length === 0) { return; }

  tags.push(...tagsToAdd);

  try {
    if (isNpfCompatible(postData)) {
      const { response: { displayText } } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`, {
        method: 'PUT',
        body: {
          ...createEditRequestBody(postData),
          tags: tags.join(',')
        }
      });

      notify(displayText);
    } else {
      await megaEdit([postId], { mode: 'add', tags: tagsToAdd });
      notify(`Edited legacy post on ${blogName}`);
    }

    const tagsElement = dom('div', { class: tagsClass });

    const innerTagsDiv = document.createElement('div');
    tagsElement.appendChild(innerTagsDiv);

    for (const tag of tags) {
      innerTagsDiv.appendChild(
        dom('a', { href: `/tagged/${encodeURIComponent(tag)}`, target: '_blank' }, null, [`#${tag}`])
      );
    }

    postElement.querySelector('footer').parentNode.prepend(tagsElement);
  } catch (error) {
    const body = error.body ?? error;
    notify(body.errors[0].detail);
  }
};

const processFormSubmit = function ({ currentTarget }) {
  const postElement = currentTarget.closest(postSelector);
  const inputTags = popupInput.value.split(',').map(inputTag => inputTag.trim());

  addTagsToPost({ postElement, inputTags });
  currentTarget.reset();
};

const processBundleClick = function ({ target }) {
  if (target.tagName !== 'BUTTON') { return; }

  const postElement = target.closest(postSelector);
  const inputTags = target.dataset.tags.split(',').map(inputTag => inputTag.trim());

  addTagsToPost({ postElement, inputTags });
  popupElement.remove();
};

const processPostOptionBundleClick = function ({ target }) {
  if (target.tagName !== 'BUTTON') { return; }
  const bundleTags = target.dataset.tags.split(',').map(bundleTag => bundleTag.trim());

  editPostFormTags({ add: bundleTags });
};

const addControlButtons = function (editButtons) {
  editButtons
    .filter(editButton => editButton.matches(`.${buttonClass} ~ div a[href*="/edit/"]`) === false)
    .forEach(editButton => {
      const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: togglePopupDisplay });
      const controlIcon = editButton.closest(controlIconSelector);
      controlIcon.before(clonedControlButton);
    });
};

popupElement.addEventListener('click', processBundleClick);
popupForm.addEventListener('submit', processFormSubmit);
postOptionPopupElement.addEventListener('click', processPostOptionBundleClick);

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass);

  pageModifications.register(`${postSelector} footer ${controlIconSelector} a[href*="/edit/"]`, addControlButtons);
  registerPostOption('quick-tags', { symbolId, onclick: togglePostOptionPopupDisplay });

  populatePopups();

  ({ originalPostTag, answerTag, autoTagAsker } = await getPreferences('quick_tags'));
  if (originalPostTag || answerTag || autoTagAsker) {
    pageModifications.register('#selected-tags', processPostForm);
  }
};

export const clean = async function () {
  pageModifications.unregister(addControlButtons);
  pageModifications.unregister(processPostForm);
  popupElement.remove();

  unregisterPostOption('quick-tags');

  $(`.${buttonClass}`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${tagsClass}`).remove();
};

export const stylesheet = true;
