import { cloneControlButton, createControlButtonTemplate } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { filterPostElements, postSelector } from '../util/interface.js';
import { onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { getPreferences } from '../util/preferences.js';
import { timelineObject } from '../util/react_props.js';
import { apiFetch, createEditRequestBody } from '../util/tumblr_helpers.js';

const buttonClass = 'xkit-quick-flags-button';
const excludeClass = 'xkit-quick-flags-done';
const warningClass = 'xkit-quick-flags-warning';
const warningTextClass = 'xkit-quick-flags-warning-text';

const symbolId = 'ri-flag-2-line';

let controlButtonTemplate;

let editedPostStates = {};

const popupData = [
  { text: 'Community Label: Mature', category: undefined },
  { text: 'Drug/Alcohol Addiction', category: 'drug_use' },
  { text: 'Violence', category: 'violence' },
  { text: 'Sexual Themes', category: 'sexual_themes' }
].map(entry => ({ ...entry, checkbox: dom('input', { type: 'checkbox' }) }));

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
  if (target === popupElement || popupElement.contains(target)) {
    return;
  }

  if (currentTarget.contains(popupElement)) {
    currentTarget.removeChild(popupElement);
  } else {
    const { id, communityLabels } = await timelineObject(target.closest(postSelector));
    updateCheckboxes(editedPostStates[id] ?? communityLabels);

    appendWithoutViewportOverflow(popupElement, currentTarget);
  }
};

const handlePopupClick = async (checkbox, category) => {
  const postElement = checkbox.closest(postSelector);

  const { id, blog: { uuid } } = await timelineObject(postElement);
  const { response: postData } = await apiFetch(`/v2/blog/${uuid}/posts/${id}`);

  const {
    hasCommunityLabel: currentHasCommunityLabel,
    categories: currentCategories
  } = postData.communityLabels;

  let hasCommunityLabel;
  let categories;

  if (category) {
    // community label will be enabled in every potential state
    hasCommunityLabel = true;
    categories = currentCategories.includes(category)
      ? currentCategories.filter(item => item !== category)
      : [...currentCategories, category];
  } else {
    // no categories will be enabled in both potential states
    hasCommunityLabel = !currentHasCommunityLabel;
    categories = [];
  }

  try {
    await setLabelsOnPost({ id, uuid, postData, hasCommunityLabel, categories });
    await onPopupAction({ postElement, hasCommunityLabel, categories });
  } catch ({ body }) {
    notify(body?.errors?.[0]?.detail || 'Failed to set flags on post!');
    await onPopupAction({ postElement, hasCommunityLabel: currentHasCommunityLabel, categories: currentCategories });
  }
};

const setLabelsOnPost = async function ({ id, uuid, postData, hasCommunityLabel, categories }) {
  if (!hasCommunityLabel && Boolean(categories.length)) {
    throw new Error(
      `Invalid label combination: ${JSON.stringify({ hasCommunityLabel, categories })}`
    );
  }

  const { response: { displayText } } = await apiFetch(`/v2/blog/${uuid}/posts/${id}`, {
    method: 'PUT',
    body: {
      ...createEditRequestBody(postData),
      hasCommunityLabel,
      communityLabelCategories: categories
    }
  });

  notify(displayText);
};

const onPopupAction = async ({ postElement, hasCommunityLabel, categories }) => {
  const {
    id,
    communityLabels: {
      hasCommunityLabel: renderedHasCommunityLabel,
      categories: renderedCategories = []
    }
  } = await timelineObject(postElement);

  editedPostStates[id] = { hasCommunityLabel, categories };
  updateCheckboxes({ hasCommunityLabel, categories });

  const renderedPostStateIncorrect =
    renderedHasCommunityLabel !== hasCommunityLabel ||
    renderedCategories.length !== categories.length ||
    renderedCategories.some(category => !categories.includes(category));

  postElement.querySelector(`.${warningClass}`)?.remove();

  if (renderedPostStateIncorrect) {
    const footerRow = postElement.querySelector(keyToCss('footerRow'));
    const warningElement = dom('div', { class: warningClass }, null, [
      dom('div', { class: warningTextClass }, null, [
        'note: navigate away and back or refresh to see edited community labels!'
      ])
    ]);
    footerRow.after(warningElement);
  }
};

popupData.forEach(({ category, checkbox }) => {
  checkbox.addEventListener('change', () => {
    checkbox.indeterminate = true;
    popupData.forEach(({ checkbox }) => { checkbox.disabled = true; });
    handlePopupClick(checkbox, category);
  });
});

// remove excludeclass?
// https://github.com/aprilsylph/XKit-Rewritten/commit/77ef1dd556992b1ef610633509ff7c136e2854c2 ????
const processPosts = postElements =>
  filterPostElements(postElements, { excludeClass }).forEach(async postElement => {
    const { id, canEdit } = await timelineObject(postElement);
    if (!canEdit) return;

    const editButton = postElement.querySelector(
      `footer ${keyToCss('controlIcon')} a[href*="/edit/"]`
    );
    if (!editButton) return;

    const clonedControlButton = cloneControlButton(controlButtonTemplate, {
      click: togglePopupDisplay
    });
    const controlIcon = editButton.closest(keyToCss('controlIcon'));
    controlIcon.before(clonedControlButton);

    delete editedPostStates[id];
  });

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass);

  const { quickLabel } = await getPreferences('quick_flags');
  if (quickLabel) {
    onNewPosts.addListener(processPosts);
  }
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
