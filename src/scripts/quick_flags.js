import { cloneControlButton, createControlButtonTemplate } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { filterPostElements, postSelector } from '../util/interface.js';
import { hideModal, modalCancelButton, modalCompleteButton, showModal } from '../util/modals.js';
import { onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { getPreferences } from '../util/preferences.js';
import { timelineObject } from '../util/react_props.js';
import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { apiFetch, createEditRequestBody } from '../util/tumblr_helpers.js';
import { userBlogs } from '../util/user.js';

const data = [
  { text: 'Community Label: Mature', category: undefined },
  { text: 'Drug/Alcohol Addiction', category: 'drug_use' },
  { text: 'Violence', category: 'violence' },
  { text: 'Sexual Themes', category: 'sexual_themes' }
];

/**
 * Adds string elements between an array's items to format it as an English prose list.
 * The Oxford comma is included.
 *
 * @param {any[]} array - Input array of any number of items
 * @param {string} andOr - String 'and' or 'or', used before the last item
 * @returns {any[]} An array alternating between the input items and strings
 */
const elementsAsList = (array, andOr) =>
  array.flatMap((item, i) => {
    if (i === array.length - 1) return [item];
    if (i === array.length - 2) return array.length === 2 ? [item, ` ${andOr} `] : [item, `, ${andOr} `];
    return [item, ', '];
  });

const getPostsFormId = 'xkit-quick-flags-bulk-get-posts';

const createBlogOption = ({ name, title, uuid }) => dom('option', { value: uuid, title }, null, [name]);
const createTagSpan = tag => dom('span', { class: 'quick-flags-bulk-tag' }, null, [tag]);
const createBlogSpan = name => dom('span', { class: 'quick-flags-bulk-blog' }, null, [name]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const dateTimeFormat = new Intl.DateTimeFormat(document.documentElement.lang, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  timeZoneName: 'short'
});

const timezoneOffsetMs = new Date().getTimezoneOffset() * 60000;

const showInitialPrompt = async () => {
  const initialForm = dom('form', { id: getPostsFormId }, { submit: confirmInitialPrompt }, [
    'Community labels to apply:',
    ...data.map(({ text, category }) =>
      dom('label', null, null, [text, dom('input', {
        type: 'checkbox',
        name: category,
        ...(!category ? { checked: true, disabled: true } : {})
      })])
    ),
    'Posts to label:',
    dom('label', null, null, [
      'Posts on blog:',
      dom('select', { name: 'blog', required: true }, null, userBlogs.map(createBlogOption))
    ]),
    dom('label', null, null, [
      dom('small', null, null, ['Posts with any of these tags (optional):']),
      dom('input', {
        type: 'text',
        name: 'tags',
        placeholder: 'Comma-separated',
        autocomplete: 'off'
      })
    ]),
    dom('label', null, null, [
      'Posts from after:',
      dom('input', { type: 'datetime-local', name: 'after', value: '2006-09-29T00:00' })
    ])
  ]);

  if (location.pathname.startsWith('/blog/')) {
    const blogName = location.pathname.split('/')[2];
    const option = [...initialForm.elements.blog.options].find(({ textContent }) => textContent === blogName);
    if (option) option.selected = true;
  }

  showModal({
    title: 'Flag posts in bulk:',
    message: [
      initialForm,
      dom('small', null, null, [
        "Note: The Tumblr API doesn't currently have an optimized method for flagging posts. This may take a long time (~3300 posts/hour)."
      ])
    ],
    buttons: [
      modalCancelButton,
      dom('input', { class: 'blue', type: 'submit', form: getPostsFormId, value: 'Next' })
    ]
  });
};

const confirmInitialPrompt = async event => {
  event.preventDefault();

  const { submitter } = event;
  if (submitter.matches('input[type="submit"]')) {
    submitter.disabled = true;
    submitter.value = 'Checking...';
  }

  const { elements } = event.currentTarget;

  const addedCategories = data
    .filter(({ category }) => category && elements[category].checked)
    .map(({ category }) => category);

  const addedCategoryText = data
    .filter(({ category }) => category && elements[category].checked)
    .map(({ text }) => text);

  const uuid = elements.blog.value;
  const name = elements.blog.selectedOptions[0].textContent;
  const tags = elements.tags.value
    .replace(/"|#/g, '')
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean);

  if (tags.length) {
    const getTagCount = async tag => {
      const { response: { totalPosts } } = await apiFetch(`/v2/blog/${uuid}/posts`, { method: 'GET', queryParams: { tag } });
      return totalPosts ?? 0;
    };
    const counts = await Promise.all(tags.map(getTagCount));
    const count = counts.reduce((a, b) => a + b, 0);

    if (count === 0) {
      showTagsNotFound({ tags, name });
      return;
    }
  }

  const afterMs = elements.after.valueAsNumber + timezoneOffsetMs;

  const afterString = dateTimeFormat.format(new Date(afterMs));
  const afterElement = dom('span', { style: 'white-space: nowrap; font-weight: bold;' }, null, [afterString]);

  const after = afterMs / 1000;

  const message = tags.length
    ? [
        'Every post on ',
        createBlogSpan(name),
        ' tagged ',
        ...elementsAsList(tags.map(createTagSpan), 'or'),
        ' from after ',
        afterElement,
        ' will be labelled as ',
        dom('strong', null, null, [
          'Mature Content',
          ...addedCategoryText.flatMap(text => [' + ', text])
        ]),
        '.'
      ]
    : [
        'Every post on ',
        createBlogSpan(name),
        ' from after ',
        afterElement,
        ' will be labelled as ',
        dom('strong', null, null, [
          'Mature Content',
          ...addedCategoryText.flatMap(text => [' + ', text])
        ]),
        '.'
      ];

  showModal({
    title: 'Are you sure?',
    message,
    buttons: [
      modalCancelButton,
      dom(
        'button',
        { class: 'red' },
        { click: () => setLabelsBulk({ uuid, name, tags, after, addedCategories }).catch(showError) },
        ['Go!']
      )
    ]
  });
};

const showTagsNotFound = ({ tags, name }) =>
  showModal({
    title: 'No tagged posts found!',
    message: [
      "It looks like you don't have any posts tagged ",
      ...elementsAsList(tags.map(createTagSpan), 'or'),
      ' on ',
      createBlogSpan(name),
      '. Did you misspell a tag?'
    ],
    buttons: [modalCompleteButton]
  });

const showPostsNotFound = ({ name }) =>
  showModal({
    title: 'No posts found!',
    message: [
      'It looks like you don\'t have any unflagged posts with the selected criteria on ',
      createBlogSpan(name),
      '.'
    ],
    buttons: [modalCompleteButton]
  });

const showError = exception => showModal({
  title: 'Something went wrong.',
  message: [exception.message],
  buttons: [modalCompleteButton]
});

const setLabelsBulk = async ({ uuid, name, tags, after, addedCategories }) => {
  const gatherStatus = dom('span', null, null, ['Gathering posts...']);
  const flagStatus = dom('span');

  showModal({
    title: 'Setting community labels on posts...',
    message: [
      dom('small', null, null, ['Do not navigate away from this page.']),
      '\n\n',
      gatherStatus,
      '\n',
      flagStatus
    ]
  });

  const allPostIdsSet = new Set();
  const filteredPostsMap = new Map();

  const collect = async resource => {
    while (resource) {
      await Promise.all([
        apiFetch(resource).then(({ response }) => {
          const posts = response.posts
            .filter(({ canEdit }) => canEdit === true)
            .filter(({ state }) => state === 'published');

          posts.forEach(({ id }) => allPostIdsSet.add(id));

          posts
            .filter(({ timestamp }) => timestamp > after)
            .filter(
              ({ communityLabels: { hasCommunityLabel, categories } }) =>
                !hasCommunityLabel || addedCategories.some(cat => !categories.includes(cat))
            )
            .forEach(postData => filteredPostsMap.set(postData.id, postData));

          const done = !posts.some(({ timestamp }) => timestamp > after);

          resource = done ? false : response.links?.next?.href;

          gatherStatus.textContent =
            `Found ${filteredPostsMap.size} flaggable posts (checked ${allPostIdsSet.size})${resource ? '...' : '.'}`;
        }),
        sleep(1000)
      ]);
    }
  };

  if (tags.length) {
    for (const tag of tags) {
      await collect(`/v2/blog/${uuid}/posts?${$.param({ tag, limit: 50, reblog_info: true })}`);
    }
  } else {
    await collect(`/v2/blog/${uuid}/posts?${$.param({ reblog_info: true })}`);
  }
  if (filteredPostsMap.size === 0) {
    showPostsNotFound({ name });
    return;
  }

  let labelledCount = 0;
  let labelledFailCount = 0;

  for (const [id, postData] of filteredPostsMap.entries()) {
    try {
      const { communityLabels: { categories: currentCategories } } = postData;
      const newCategories = [...new Set([...currentCategories, ...addedCategories])];

      await Promise.all([
        apiFetch(`/v2/blog/${uuid}/posts/${id}`, {
          method: 'PUT',
          body: {
            ...createEditRequestBody(postData),
            hasCommunityLabel: true,
            communityLabelCategories: newCategories
          }
        }),
        sleep(1000)
      ]);
      labelledCount++;
      editedPostStates[id] = { hasCommunityLabel: true, categories: newCategories };
    } catch (exception) {
      console.error(exception);
      labelledFailCount++;
    }
    flagStatus.textContent = `Set community labels on ${labelledCount} posts... ${labelledFailCount ? `(failed: ${labelledFailCount})` : ''}`;
  }

  await sleep(1000);

  showModal({
    title: 'All done!',
    message: [
      `Set community labels on ${labelledCount} posts${labelledFailCount ? ` (failed: ${labelledFailCount})` : ''}.\n`,
      'Refresh the page to see the result.'
    ],
    buttons: [
      dom('button', null, { click: hideModal }, ['Close']),
      dom('button', { class: 'blue' }, { click: () => location.reload() }, ['Refresh'])
    ]
  });
};

const sidebarOptions = {
  id: 'quick-flags-bulk',
  title: 'Quick Flags',
  rows: [{
    label: 'Flag posts in bulk',
    onclick: showInitialPrompt,
    carrot: true
  }],
  visibility: () => /^\/blog\/[^/]+\/?$/.test(location.pathname)
};

const buttonClass = 'xkit-quick-flags-button';
const excludeClass = 'xkit-quick-flags-done';
const warningClass = 'xkit-quick-flags-warning';
const warningTextClass = 'xkit-quick-flags-warning-text';

const symbolId = 'ri-flag-2-line';

let controlButtonTemplate;

let editedPostStates = {};

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
    await setLabelsOnPost({ id, uuid, postData, hasCommunityLabel, categories });
    await onPopupAction({ postElement, hasCommunityLabel, categories });
  } catch ({ body }) {
    notify(body?.errors?.[0]?.detail || 'Failed to set flags on post!');
    await onPopupAction({
      postElement,
      hasCommunityLabel: currentHasCommunityLabel,
      categories: currentCategories
    });
  }
};

const setLabelsOnPost = async function ({ id, uuid, postData, hasCommunityLabel, categories }) {
  if (!hasCommunityLabel && Boolean(categories.length)) {
    throw new Error(`Invalid label combination: ${JSON.stringify({ hasCommunityLabel, categories })}`);
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

const processPosts = postElements =>
  filterPostElements(postElements, { excludeClass }).forEach(async postElement => {
    const { id, canEdit } = await timelineObject(postElement);
    if (!canEdit) return;

    const editButton = postElement.querySelector(
      `footer ${keyToCss('controlIcon')} a[href*="/edit/"]`
    );
    if (!editButton) return;

    const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: togglePopupDisplay });
    const controlIcon = editButton.closest(keyToCss('controlIcon'));
    controlIcon.before(clonedControlButton);

    delete editedPostStates[id];
  });

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass);

  addSidebarItem(sidebarOptions);

  const { quickLabel } = await getPreferences('quick_flags');
  if (quickLabel) {
    onNewPosts.addListener(processPosts);
  }
};

export const clean = async function () {
  removeSidebarItem(sidebarOptions.id);
  onNewPosts.removeListener(processPosts);

  popupElement.remove();
  $(`.${buttonClass}`).remove();
  $(`.${warningClass}`).remove();
  $(`.${excludeClass}`).removeClass(excludeClass);

  editedPostStates = {};
};

export const stylesheet = true;
