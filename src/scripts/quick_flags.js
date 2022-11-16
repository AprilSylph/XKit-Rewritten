import { cloneControlButton, createControlButtonTemplate } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { filterPostElements, postSelector } from '../util/interface.js';
import { onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { getPreferences } from '../util/preferences.js';
import { timelineObject } from '../util/react_props.js';
import { apiFetch } from '../util/tumblr_helpers.js';

// remove this probably
const DO_NOT_PROCESS_REBLOGS = false;

const buttonClass = 'xkit-quick-flags-button';
const excludeClass = 'xkit-quick-flags-done';
const warningClass = 'xkit-quick-flags-warning';
const warningTextClass = 'xkit-quick-flags-warning-text';

const symbolId = 'ri-flag-2-line';

let controlButtonTemplate;

let editedPostStates = new WeakMap();

const data = [
  ['Mature (no category)', undefined, dom('input', { type: 'checkbox' })],
  ['Drug/Alcohol Addiction', 'drug_use', dom('input', { type: 'checkbox' })],
  ['Violence', 'violence', dom('input', { type: 'checkbox' })],
  ['Sexual Themes', 'sexual_themes', dom('input', { type: 'checkbox' })]
];

const buttons = data.map(([text, category, checkbox]) => {
  const button = dom('label', null, null, [checkbox, text]);
  if (category) checkbox.value = category;
  return button;
});

const updateCheckboxes = ({ hasCommunityLabel, categories }) => {
  data.forEach(([text, category, checkbox]) => {
    checkbox.indeterminate = false;
    if (category) {
      checkbox.checked = categories.includes(category);
    } else {
      checkbox.checked = hasCommunityLabel;
    }
  });
};

const popupElement = dom('div', { id: 'quick-flags' }, null, buttons);

// extract this?
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
    appendWithoutViewportOverflow(popupElement, currentTarget);

    const postElement = target.closest(postSelector);

    updateCheckboxes(editedPostStates.get(postElement));
  }
};

let throttle = false;

const handleClick = async (checkbox, category) => {
  if (throttle) return;
  throttle = true;

  checkbox.indeterminate = true;

  const postElement = checkbox.closest(postSelector);

  const { hasCommunityLabel: currentHasCommunityLabel, categories: currentCategories } =
    editedPostStates.get(postElement);

  let hasCommunityLabel;
  let categories;

  if (category) {
    hasCommunityLabel = true;
    categories = currentCategories.includes(category)
      ? currentCategories.filter(item => item !== category)
      : [...currentCategories, category];
  } else {
    hasCommunityLabel = !currentHasCommunityLabel;
    categories = [];
  }
  await setLabelsOnPost({ postElement, hasCommunityLabel, categories });
  throttle = false;
};

const setLabelsOnPost = async function ({ postElement, hasCommunityLabel, categories }) {
  if (!hasCommunityLabel && Boolean(categories.length)) {
    throw new Error(
      `Invalid label combination: ${JSON.stringify({ hasCommunityLabel, categories })}`
    );
  }

  const postId = postElement.dataset.id;
  const {
    blog: { uuid }
  } = await timelineObject(postElement);

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

  try {
    const {
      response: { displayText }
    } = await apiFetch(`/v2/blog/${uuid}/posts/${postId}`, {
      method: 'PUT',
      body: {
        content,
        layout,
        state,
        publish_on: publishOn,
        date,
        tags: tags.join(','),
        source_url: sourceUrlRaw,
        slug,
        has_community_label: hasCommunityLabel,
        community_label_categories: categories
      }
    });

    notify(displayText);

    await onSuccess({ postElement, hasCommunityLabel, categories });
  } catch ({ body }) {
    notify(body.errors[0].detail);
  }
};

const onSuccess = async ({ postElement, hasCommunityLabel, categories }) => {
  editedPostStates.set(postElement, { hasCommunityLabel, categories });
  updateCheckboxes({ hasCommunityLabel, categories });

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
      dom('div', { class: warningTextClass }, null, [
        'note: navigate away and back or refresh to see edited community labels!'
      ])
    ]);
    footerRow.after(warningElement);
  }
};

data.forEach(([text, category, checkbox]) => {
  checkbox.addEventListener('change', () => handleClick(checkbox, category));
});

// remove excludeclass?
// https://github.com/aprilsylph/XKit-Rewritten/commit/77ef1dd556992b1ef610633509ff7c136e2854c2 ????
const processPosts = postElements =>
  filterPostElements(postElements, { excludeClass }).forEach(async postElement => {
    const {
      rebloggedRootId,
      canEdit,
      communityLabels: { hasCommunityLabel, categories }
    } = await timelineObject(postElement);

    if (rebloggedRootId && DO_NOT_PROCESS_REBLOGS) return;
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

    editedPostStates.set(postElement, { hasCommunityLabel, categories });
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

  $(`.${warningClass}`).remove();
  $('[data-community-labelled]').removeAttr('data-community-labelled');
  $(`.${excludeClass}`).removeClass(excludeClass);

  editedPostStates = new WeakMap();
  throttle = false;

  // maybe other stuff
};

export const stylesheet = true;
