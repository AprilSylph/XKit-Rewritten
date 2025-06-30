import { cloneControlButton, createControlButtonTemplate, insertControlButton } from '../../utils/control_buttons.js';
import { dom } from '../../utils/dom.js';
import { appendWithoutOverflow, filterPostElements, getTimelineItemWrapper, postSelector } from '../../utils/interface.js';
import { megaEdit } from '../../utils/mega_editor.js';
import { modalCancelButton, modalCompleteButton, showErrorModal, showModal } from '../../utils/modals.js';
import { onNewPosts, pageModifications } from '../../utils/mutations.js';
import { notify } from '../../utils/notifications.js';
import { registerPostOption, unregisterPostOption } from '../../utils/post_actions.js';
import { getPreferences } from '../../utils/preferences.js';
import { timelineObject, editPostFormTags } from '../../utils/react_props.js';
import { apiFetch, createEditRequestBody, isNpfCompatible } from '../../utils/tumblr_helpers.js';

const symbolId = 'ri-price-tag-3-line';
const buttonClass = 'xkit-quick-tags-button';
const excludeClass = 'xkit-quick-tags-done';
const tagsClass = 'xkit-quick-tags-tags';

let originalPostTag;
let answerTag;
let autoTagAsker;
let showReblogSuggestions;
let tagBundles;

let controlButtonTemplate;

const popupElement = dom('div', { id: 'quick-tags' });
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
const popupForm = dom('form', null, { submit: event => event.preventDefault() }, [popupInput]);

const postOptionPopupElement = dom('div', { id: 'quick-tags-post-option' });

const storageKey = 'quick_tags.preferences.tagBundles';

let editedTagsMap = new WeakMap();

const createBundleButton = tagBundle => {
  const bundleButton = dom('button', null, null, [tagBundle.title]);
  bundleButton.dataset.tags = tagBundle.tags;
  return bundleButton;
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
    if (Object.keys(changes).includes(storageKey)) {
      ({ newValue: tagBundles = [] } = changes[storageKey]);
    }

    ({ originalPostTag, answerTag, autoTagAsker, showReblogSuggestions } = await getPreferences('quick_tags'));
    if (originalPostTag || answerTag || autoTagAsker) {
      pageModifications.register('#selected-tags', processPostForm);
    } else {
      pageModifications.unregister(processPostForm);
    }
  }
};

const togglePopupDisplay = async function ({ target, currentTarget: controlButton }) {
  if (target === popupElement || popupElement.contains(target)) { return; }

  const buttonContainer = controlButton.parentElement;

  if (buttonContainer.contains(popupElement)) {
    buttonContainer.removeChild(popupElement);
  } else {
    popupElement.replaceChildren(popupForm, ...tagBundles.map(createBundleButton));
    appendWithoutOverflow(popupElement, buttonContainer);

    if (showReblogSuggestions) {
      const { rebloggedFromUuid, rebloggedFromId } = await timelineObject(controlButton.closest(postSelector));
      if (rebloggedFromUuid && rebloggedFromId) {
        const { response: { tags, blogName, postAuthor, rebloggedRootName } } = await apiFetch(`/v2/blog/${rebloggedFromUuid}/posts/${rebloggedFromId}`);

        const suggestableTags = tags;
        if (blogName) suggestableTags.push(blogName);
        if (postAuthor) suggestableTags.push(postAuthor);
        if (rebloggedRootName) suggestableTags.push(rebloggedRootName);
        const tagsToSuggest = suggestableTags.filter((tag, index, array) => array.indexOf(tag) === index);

        if (tagsToSuggest.length) {
          popupElement.lastElementChild?.style?.setProperty('margin-bottom', '6px');
          popupElement.append(...tagsToSuggest.map(tag => createBundleButton({ title: tag, tags: tag })));
        }
      }
    }
  }
};

const togglePostOptionPopupDisplay = async function ({ target, currentTarget }) {
  if (target === postOptionPopupElement || postOptionPopupElement.contains(target)) { return; }

  if (currentTarget.contains(postOptionPopupElement)) {
    currentTarget.removeChild(postOptionPopupElement);
  } else {
    postOptionPopupElement.replaceChildren(...tagBundles.map(createBundleButton));
    appendWithoutOverflow(postOptionPopupElement, currentTarget);
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

  editedTagsMap.set(getTimelineItemWrapper(postElement), tags);
  addFakeTagsToFooter(postElement, tags);
};

const addFakeTagsToFooter = (postElement, tags) => {
  const fakeTags = tags.map(tag =>
    dom('a', { href: `/tagged/${encodeURIComponent(tag)}`, target: '_blank' }, null, [`#${tag}`])
  );
  const tagsElement = dom('div', { class: tagsClass }, null, [dom('div', null, null, fakeTags)]);

  postElement.querySelector('footer').parentNode.prepend(tagsElement);
};

const processFormSubmit = function ({ currentTarget }) {
  const postElement = currentTarget.closest(postSelector);
  const inputTags = popupInput.value.split(',').map(inputTag => inputTag.trim());

  addTagsToPost({ postElement, inputTags }).catch(showErrorModal);
  currentTarget.reset();
};

const processBundleClick = function ({ target }) {
  if (target.tagName !== 'BUTTON') { return; }

  const postElement = target.closest(postSelector);
  const inputTags = target.dataset.tags.split(',').map(inputTag => inputTag.trim());

  addTagsToPost({ postElement, inputTags }).catch(showErrorModal);
  popupElement.remove();
};

const processPostOptionBundleClick = function ({ target }) {
  if (target.tagName !== 'BUTTON') { return; }
  const bundleTags = target.dataset.tags.split(',').map(bundleTag => bundleTag.trim());

  editPostFormTags({ add: bundleTags });
};

const processPosts = postElements => filterPostElements(postElements).forEach(async postElement => {
  const tags = editedTagsMap.get(getTimelineItemWrapper(postElement));
  tags && addFakeTagsToFooter(postElement, tags);

  const { state, canEdit } = await timelineObject(postElement);
  if (canEdit && ['ask', 'submission'].includes(state) === false) {
    const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: togglePopupDisplay });
    insertControlButton(postElement, clonedControlButton, buttonClass);
  }
});

popupElement.addEventListener('click', processBundleClick);
popupForm.addEventListener('submit', processFormSubmit);
postOptionPopupElement.addEventListener('click', processPostOptionBundleClick);

const migrateTags = async ({ detail }) => {
  const newTagBundles = JSON.parse(detail);

  if (Array.isArray(newTagBundles)) {
    window.dispatchEvent(new CustomEvent('xkit-quick-tags-migration-success'));

    const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);

    const toAdd = newTagBundles
      .map(({ title, tags }) => ({ title: String(title), tags: String(tags) }))
      .filter(
        newTagBundle =>
          !tagBundles.some(
            tagBundle =>
              newTagBundle.title === tagBundle.title && newTagBundle.tags === tagBundle.tags
          )
      );

    if (toAdd.length) {
      await new Promise(resolve => {
        showModal({
          title: 'Add tag bundles?',
          message: [
            `Would you like to import the following ${
              toAdd.length > 1 ? `${toAdd.length} tag bundles` : 'tag bundle'
            } from New XKit to XKit Rewritten?`,
            '\n\n',
            dom('ul', null, null, toAdd.map(({ title }) => dom('li', null, null, [title])))
          ],
          buttons: [
            modalCancelButton,
            dom('button', { class: 'blue' }, { click: resolve }, ['Confirm'])
          ]
        });
      });

      tagBundles.push(...toAdd);
      await browser.storage.local.set({ [storageKey]: tagBundles });

      showModal({
        title: 'Success',
        message: `Imported ${toAdd.length > 1 ? `${toAdd.length} tag bundles` : 'a tag bundle'}!`,
        buttons: [modalCompleteButton]
      });
    } else {
      showModal({
        title: 'No new bundles!',
        message: 'Your XKit Rewritten configuration has these tag bundles already.',
        buttons: [modalCompleteButton]
      });
    }
  }
};

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass, 'Quick Tags');

  onNewPosts.addListener(processPosts);
  registerPostOption('quick-tags', { symbolId, onclick: togglePostOptionPopupDisplay });

  ({ [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey));

  ({ originalPostTag, answerTag, autoTagAsker, showReblogSuggestions } = await getPreferences('quick_tags'));
  if (originalPostTag || answerTag || autoTagAsker) {
    pageModifications.register('#selected-tags', processPostForm);
  }

  window.addEventListener('xkit-quick-tags-migration', migrateTags);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  pageModifications.unregister(processPostForm);
  popupElement.remove();

  unregisterPostOption('quick-tags');

  $(`.${buttonClass}`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${tagsClass}`).remove();

  editedTagsMap = new WeakMap();

  window.removeEventListener('xkit-quick-tags-migration', migrateTags);
};

export const stylesheet = true;
