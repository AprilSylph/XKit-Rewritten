import { cloneControlButton, createControlButtonTemplate } from '../utils/control_buttons.js';
import { keyToCss } from '../utils/css_map.js';
import { dom } from '../utils/dom.js';
import { filterPostElements, getTimelineItemWrapper, postSelector } from '../utils/interface.js';
import { translate } from '../utils/language_data.js';
import { bulkCommunityLabel } from '../utils/mega_editor.js';
import { showErrorModal } from '../utils/modals.js';
import { onNewPosts } from '../utils/mutations.js';
import { notify } from '../utils/notifications.js';
import { timelineObject } from '../utils/react_props.js';
import { apiFetch } from '../utils/tumblr_helpers.js';

const data = [
  { text: 'Community Label: Mature', category: undefined },
  { text: 'Drug/Alcohol Addiction', category: 'drug_use' },
  { text: 'Violence', category: 'violence' },
  { text: 'Sexual Themes', category: 'sexual_themes' }
];

const buttonClass = 'xkit-quick-flags-button';
const excludeClass = 'xkit-quick-flags-done';
const warningClass = 'xkit-quick-flags-warning';

const symbolId = 'ri-flag-2-line';

let controlButtonTemplate;

let editedPostStates = new WeakMap();

const popupData = data.map(entry => ({ ...entry, checkbox: dom('input', { type: 'checkbox' }) }));

const updateCheckboxes = ({ hasCommunityLabel, categories }) => {
  popupData.forEach(({ category, checkbox }) => {
    checkbox.indeterminate = false;
    checkbox.disabled = false;
    checkbox.checked = category ? categories.includes(category) : hasCommunityLabel;
  });
};

const buttons = popupData.map(({ text, category, checkbox }) => {
  const button = dom('label', !category ? { class: 'no-category' } : null, null, [checkbox, text]);
  if (category) checkbox.value = category;
  return button;
});
const popupElement = dom('div', { id: 'quick-flags' }, null, buttons);

const appendWithoutViewportOverflow = (element, target) => {
  element.className = 'below';
  target.appendChild(element);
  if (element.getBoundingClientRect().bottom > document.documentElement.clientHeight) {
    element.className = 'above';
  }
};

const togglePopupDisplay = async function ({ target, currentTarget }) {
  if (target === popupElement || popupElement.contains(target)) { return; }

  if (currentTarget.contains(popupElement)) {
    currentTarget.removeChild(popupElement);
  } else {
    const postElement = target.closest(postSelector);
    const { communityLabels } = await timelineObject(postElement);
    updateCheckboxes(editedPostStates.get(getTimelineItemWrapper(postElement)) ?? communityLabels);

    appendWithoutViewportOverflow(popupElement, currentTarget);
  }
};

const handlePopupClick = async (checkbox, category) => {
  const postElement = checkbox.closest(postSelector);

  const { id, blog: { uuid, name } } = await timelineObject(postElement);
  const { response: postData } = await apiFetch(`/v2/blog/${uuid}/posts/${id}`);

  const {
    hasCommunityLabel: currentHasCommunityLabel,
    categories: currentCategories
  } = postData.communityLabels;

  let hasCommunityLabel;
  let categories;

  if (category) {
    categories = currentCategories.includes(category)
      ? currentCategories.filter(item => item !== category)
      : [...currentCategories, category];

    // community label will be enabled in every possible state
    hasCommunityLabel = true;
  } else {
    hasCommunityLabel = !currentHasCommunityLabel;

    // no categories will be enabled in either possible state
    categories = [];
  }

  try {
    await bulkCommunityLabel(name, [id], { hasCommunityLabel, categories });

    notify('Updated community labels!');
    editedPostStates.set(getTimelineItemWrapper(postElement), { hasCommunityLabel, categories });
    updatePostWarningElement(postElement);
    updateCheckboxes({ hasCommunityLabel, categories });
  } catch ({ body }) {
    notify(body?.errors?.[0]?.detail || 'Failed to update community labels!');
    updateCheckboxes({ hasCommunityLabel: currentHasCommunityLabel, categories: currentCategories });
  }
};

const updatePostWarningElement = async (postElement) => {
  const editedPostState = editedPostStates.get(getTimelineItemWrapper(postElement));
  if (!editedPostState) return;

  const { hasCommunityLabel, categories } = editedPostState;
  const {
    communityLabels: {
      hasCommunityLabel: renderedHasCommunityLabel,
      categories: renderedCategories = []
    }
  } = await timelineObject(postElement);

  const renderedPostStateIncorrect =
    renderedHasCommunityLabel !== hasCommunityLabel ||
    renderedCategories.length !== categories.length ||
    renderedCategories.some(category => !categories.includes(category));

  postElement.querySelector(`.${warningClass}`)?.remove();

  if (renderedPostStateIncorrect) {
    const footerRow = postElement.querySelector(keyToCss('footerRow'));
    const warningElement = dom('div', { class: warningClass }, null, [
      'note: navigate away and back or refresh to see edited community labels!'
    ]);
    footerRow.after(warningElement);
  }
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
    updatePostWarningElement(postElement);

    const { canEdit } = await timelineObject(postElement);
    if (!canEdit) return;

    const editButton = postElement.querySelector(
      `footer ${keyToCss('controlIcon')} a[href*="/edit/"][aria-label=${translate('Edit')}]`
    );
    if (!editButton) return;

    const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: togglePopupDisplay });
    const controlIcon = editButton.closest(keyToCss('controlIcon'));
    controlIcon.before(clonedControlButton);
  });

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass, 'Quick Flags');
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  popupElement.remove();
  $(`.${buttonClass}`).remove();
  $(`.${warningClass}`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);

  editedPostStates = new WeakMap();
};

export const stylesheet = true;
