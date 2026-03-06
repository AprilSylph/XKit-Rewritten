import { cloneControlButton, createControlButtonTemplate, insertControlButton } from '../../utils/control_buttons.js';
import { div, input, label } from '../../utils/dom.js';
import { appendWithoutOverflow, filterPostElements, postSelector } from '../../utils/interface.js';
import { bulkCommunityLabel } from '../../utils/mega_editor.js';
import { showErrorModal } from '../../utils/modals.js';
import { onNewPosts } from '../../utils/mutations.js';
import { notify } from '../../utils/notifications.js';
import { timelineObject, updatePostOnPage } from '../../utils/react_props.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';

const data = [
  { text: 'Content Label: Mature', category: undefined },
  { text: 'Drug/Alcohol Addiction', category: 'drug_use' },
  { text: 'Violence', category: 'violence' },
  { text: 'Sexual Themes', category: 'sexual_themes' },
];

const buttonClass = 'xkit-quick-flags-button';
const excludeClass = 'xkit-quick-flags-done';

const symbolId = 'ri-flag-2-line';

let controlButtonTemplate;

const popupData = data.map(entry => ({ ...entry, checkbox: input({ type: 'checkbox' }) }));

const updateCheckboxes = ({ hasCommunityLabel, categories }) => {
  popupData.forEach(({ category, checkbox }) => {
    checkbox.indeterminate = false;
    checkbox.disabled = false;
    checkbox.checked = category ? categories.includes(category) : hasCommunityLabel;
  });
};

const buttons = popupData.map(({ text, category, checkbox }) => {
  const button = label(!category ? { class: 'no-category' } : {}, [checkbox, text]);
  if (category) checkbox.value = category;
  return button;
});
const popupElement = div({ id: 'quick-flags' }, buttons);

const togglePopupDisplay = async function ({ target, currentTarget: controlButton }) {
  if (target === popupElement || popupElement.contains(target)) { return; }

  const buttonContainer = controlButton.parentElement;

  if (buttonContainer.contains(popupElement)) {
    buttonContainer.removeChild(popupElement);
  } else {
    const postElement = target.closest(postSelector);
    const { id, blog: { uuid } } = await timelineObject(postElement);
    const { response: postData } = await apiFetch(`/v2/blog/${uuid}/posts/${id}`);
    updateCheckboxes(postData.communityLabels);

    appendWithoutOverflow(popupElement, buttonContainer);
  }
};

const handlePopupClick = async (checkbox, category) => {
  const postElement = checkbox.closest(postSelector);

  const { id, blog: { uuid, name } } = await timelineObject(postElement);
  const { response: postData } = await apiFetch(`/v2/blog/${uuid}/posts/${id}`);

  const {
    hasCommunityLabel: currentHasCommunityLabel,
    categories: currentCategories,
  } = postData.communityLabels;

  let hasCommunityLabel;
  let categories;

  if (category) {
    categories = currentCategories.includes(category)
      ? currentCategories.filter(item => item !== category)
      : [...currentCategories, category];

    // label will be enabled in every possible state
    hasCommunityLabel = true;
  } else {
    hasCommunityLabel = !currentHasCommunityLabel;

    // no categories will be enabled in either possible state
    categories = [];
  }

  try {
    await bulkCommunityLabel(name, [id], { hasCommunityLabel, categories });

    notify('Updated content labels!');
    updateCheckboxes({ hasCommunityLabel, categories });
  } catch (error) {
    console.log(error);
    notify(error.body?.errors?.[0]?.detail || 'Failed to update content labels!');
    updateCheckboxes({ hasCommunityLabel: currentHasCommunityLabel, categories: currentCategories });
  }

  await updatePostOnPage(postElement, ['communityLabels', 'headerContext']);
};

popupData.forEach(({ category, checkbox }) => {
  checkbox.addEventListener('change', () => {
    checkbox.indeterminate = true;
    popupData.forEach(({ checkbox }) => { checkbox.disabled = true; });
    handlePopupClick(checkbox, category).catch(showErrorModal);
  });
});

const processPosts = postElements =>
  filterPostElements(postElements, { excludeClass }).forEach(async postElement => {
    const { state, canEdit } = await timelineObject(postElement);
    if (canEdit && ['ask', 'submission'].includes(state) === false) {
      const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: togglePopupDisplay });
      insertControlButton(postElement, clonedControlButton, buttonClass);
    }
  });

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass, 'Quick Flags');
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  popupElement.remove();
  $(`.${buttonClass}`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
