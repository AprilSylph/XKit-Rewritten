import { dom } from '../utils/dom.js';
import { bulkCommunityLabel } from '../utils/mega_editor.js';
import { hideModal, modalCancelButton, modalCompleteButton, showErrorModal, showModal } from '../utils/modals.js';
import { addSidebarItem, removeSidebarItem } from '../utils/sidebar.js';
import { apiFetch } from '../utils/tumblr_helpers.js';
import { userBlogs } from '../utils/user.js';

const data = [
  { text: 'Community Label: Mature', category: undefined },
  { text: 'Drug/Alcohol Addiction', category: 'drug_use' },
  { text: 'Violence', category: 'violence' },
  { text: 'Sexual Themes', category: 'sexual_themes' }
];

/**
 * Adds string elements between an array's items to format it as an English prose list.
 * The Oxford comma is included.
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

const getPostsFormId = 'xkit-mass-labeler-get-posts';

const createBlogOption = ({ name, title, uuid }) => dom('option', { value: uuid, title }, null, [name]);
const createTagSpan = tag => dom('span', { class: 'mass-labeler-tag' }, null, [tag]);
const createBlogSpan = name => dom('span', { class: 'mass-labeler-blog' }, null, [name]);
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
  const initialForm = dom('form', { id: getPostsFormId }, { submit: event => confirmInitialPrompt(event).catch(showErrorModal) }, [
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
    title: 'Add community labels in bulk:',
    message: [initialForm],
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

  const message = [
    'Every post on ',
    createBlogSpan(name),
    ...(tags.length
      ? [
          ' tagged ',
          ...elementsAsList(tags.map(createTagSpan), 'or')
        ]
      : []),
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
        { click: () => setLabelsBulk({ uuid, name, tags, after, addedCategories }).catch(showErrorModal) },
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
      "It looks like you don't have any unlabelled posts with the selected criteria on ",
      createBlogSpan(name),
      '.'
    ],
    buttons: [modalCompleteButton]
  });

const setLabelsBulk = async ({ uuid, name, tags, after, addedCategories }) => {
  const gatherStatus = dom('span', null, null, ['Gathering posts...']);
  const labelStatus = dom('span');

  showModal({
    title: 'Setting community labels on posts...',
    message: [
      dom('small', null, null, ['Do not navigate away from this page.']),
      '\n\n',
      gatherStatus,
      '\n',
      labelStatus
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
            `Found ${filteredPostsMap.size} unlabelled posts (checked ${allPostIdsSet.size})${resource ? '...' : '.'}`;
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

  const postIdsByCurrentValue = {};

  filteredPostsMap.forEach((postData, id) => {
    // categories are probably in a stable order, but this will not cause problems if they aren't
    const currentCategoriesJSON = JSON.stringify(postData.communityLabels.categories);

    postIdsByCurrentValue[currentCategoriesJSON] ??= [];
    postIdsByCurrentValue[currentCategoriesJSON].push(id);
  });

  let labelledCount = 0;
  let labelledFailCount = 0;

  for (const [currentCategoriesJSON, postIdsWithCurrentValue] of Object.entries(postIdsByCurrentValue)) {
    const currentCategories = JSON.parse(currentCategoriesJSON);

    const newCategories = [...new Set([...currentCategories, ...addedCategories])];

    while (postIdsWithCurrentValue.length !== 0) {
      const postIds = postIdsWithCurrentValue.splice(0, 100);
      await Promise.all([
        bulkCommunityLabel(name, postIds, { hasCommunityLabel: true, categories: newCategories }).then(() => {
          labelledCount += postIds.length;
        }).catch(() => {
          labelledFailCount += postIds.length;
        }).finally(() => {
          labelStatus.textContent = `Set community labels on ${labelledCount} posts... ${labelledFailCount ? `(failed: ${labelledFailCount})` : ''}`;
        }),
        sleep(1000)
      ]);
    }
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
  id: 'mass-labeler',
  title: 'Mass Labeler',
  rows: [{
    label: 'Add community labels',
    onclick: showInitialPrompt,
    carrot: true
  }],
  visibility: () => /^\/blog\/[^/]+\/?$/.test(location.pathname)
};

export const main = async function () {
  addSidebarItem(sidebarOptions);
};

export const clean = async function () {
  removeSidebarItem(sidebarOptions.id);
};

export const stylesheet = true;
