import { cloneControlButton } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { buildStyle, filterPostElements } from '../util/interface.js';
import { onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { getPreferences } from '../util/preferences.js';
import { timelineObject } from '../util/react_props.js';
import { buildSvg } from '../util/remixicon.js';
import { apiFetch } from '../util/tumblr_helpers.js';

// need clarification from staff if you're supposed to be able to community label a reblog
const DO_NOT_PROCESS_REBLOGS = true;

const containerClass = 'xkit-community-label-container';
const flagButtonClass = 'xkit-community-label-flag-button';
const miniButtonClass = 'xkit-community-label-mini-button';
const warningClass = 'xkit-community-label-warning';
const warningTextClass = 'xkit-community-label-warning-text';

const flagId = 'ri-flag-2-line';
const categoryData = [
  ['drug_use', 'ri-goblet-fill', 'Drug and Alcohol Addiction'],
  ['violence', 'ri-slice-line', 'Violence'],
  ['sexual_themes', 'ri-heart-line', 'Sexual Themes']
];

let editedPostStates = new WeakMap();

const activeButtonSelector = `[data-community-labelled] .${flagButtonClass},
${categoryData
  .map(([category]) => `[data-community-labelled*="${category}"] [data-category="${category}"]`)
  .join(', ')}
`;

// I am bad at css
const sizeStyle = 'width: 24px; height: 24px;';

// what color to use for button highlight?
// red and accent are each invisible on at least one palette :|
const styleElement = buildStyle(`
  :is(${activeButtonSelector}) svg {
    fill: rgb(var(--red));
  }

  .${containerClass} {
    display: flex;
    border-radius: 16px;
    padding: 4px;
    background-color: rgb(var(--secondary-accent));
  }

  .${flagButtonClass} {
    ${sizeStyle}
     margin: 0px 5px;
  }

  .${miniButtonClass} {
    display: none;
  }

  [data-community-labelled] .${miniButtonClass}, .${containerClass}:hover .${miniButtonClass} {
    display: block;
    ${sizeStyle}
    transform: scale(0.7);
  }

  .${warningClass} {
    background-color: rgb(var(--secondary-accent));
    line-height: 1;
    display: flex;
  }

  .${warningTextClass} {
    margin: 0.5em auto;
  }
`);

const handleClick = async (category, postElement) => {
  if (throttle) return;
  throttle = true;

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

// refactor: maybe don't use a dataset for rendering?
const updateButtonStatus = postElement => {
  const { hasCommunityLabel, categories } = editedPostStates.get(postElement);
  if (hasCommunityLabel) {
    postElement.dataset.communityLabelled = categories.join(',');
  } else {
    delete postElement.dataset.communityLabelled;
  }
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
  updateButtonStatus(postElement);

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

export const createButtonTemplate = function (symbolId, className, text) {
  return dom('div', { class: className, title: `Toggle community label: ${text}` }, null, [
    dom('button', { class: 'xkit-control-button', style: sizeStyle }, null, [
      dom(
        'span',
        { class: 'xkit-control-button-inner', style: sizeStyle, tabindex: '-1' },
        null,
        [buildSvg(symbolId)]
      )
    ])
  ]);
};

const flagButtonTemplate = createButtonTemplate(flagId, flagButtonClass, 'Mature');
const miniButtonTemplates = categoryData.map(([category, iconId, text]) => {
  const template = createButtonTemplate(iconId, miniButtonClass, text);
  template.dataset.category = category;
  return [template, category];
});

let throttle = false;

const processPosts = postElements =>
  filterPostElements(postElements).forEach(async postElement => {
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
    const controls = editButton.closest(keyToCss('controls'));

    const clonedControlButton = cloneControlButton(flagButtonTemplate, {
      click: () => handleClick(undefined, postElement)
    });
    const clonedMiniButtons = miniButtonTemplates.map(([miniTemplate, category]) =>
      cloneControlButton(miniTemplate, {
        click: () => handleClick(category, postElement)
      })
    );

    const container = dom('div', { class: containerClass }, null, [
      clonedControlButton,
      ...clonedMiniButtons
    ]);
    controls.prepend(container);

    editedPostStates.set(postElement, { hasCommunityLabel, categories });
    updateButtonStatus(postElement);
  });

export const main = async function () {
  document.head.append(styleElement);
  const { quickLabel } = await getPreferences('community_labeler');
  if (quickLabel) {
    onNewPosts.addListener(processPosts);
  }
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  styleElement.remove();
  $(`.${containerClass}`).remove();
  $(`.${warningClass}`).remove();
  $('[data-community-labelled]').removeAttr('data-community-labelled');

  editedPostStates = new WeakMap();
  throttle = false;

  // maybe other stuff
};
