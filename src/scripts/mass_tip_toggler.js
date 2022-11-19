import { dom } from '../util/dom.js';
import { showModal, modalCancelButton, modalCompleteButton, hideModal } from '../util/modals.js';
import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { apiFetch } from '../util/tumblr_helpers.js';
import { userBlogs } from '../util/user.js';

const getPostsFormId = 'xkit-mass-tip-toggler-get-posts';

const createBlogOption = ({ name, title, uuid }) => dom('option', { value: uuid, title }, null, [name]);
const createTagSpan = tag => dom('span', { class: 'mass-tip-toggler-tag' }, null, [tag]);
const createBlogSpan = name => dom('span', { class: 'mass-tip-toggler-blog' }, null, [name]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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

const showInitialPrompt = async () => {
  const initialForm = dom('form', { id: getPostsFormId }, { submit: confirmInitialPrompt }, [
    dom('label', null, null, [
      'Action:',
      dom('select', { name: 'action', required: true }, null, [
        dom('option', { value: 'enabled', title: 'Enable Tipping' }, null, ['Enable Tipping']),
        dom('option', { value: 'disabled', title: 'Disable Tipping' }, null, ['Disable Tipping'])
      ])
    ]),
    dom('label', null, null, [
      'Original posts on blog:',
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
    ])
  ]);

  if (location.pathname.startsWith('/blog/')) {
    const blogName = location.pathname.split('/')[2];
    const option = [...initialForm.elements.blog.options].find(({ textContent }) => textContent === blogName);
    if (option) option.selected = true;
  }

  showModal({
    title: 'Enable/disable tipping on:',
    message: [
      '[Explanation of how the "Add tip button to your posts by default" setting works goes somewhere. Also a warning that this is incredibly slow unless the mass post editor endpoint gets tipping.]',
      initialForm,
      dom('small', null, null, [
        'This has no effect unless you enable tipping in Tumblr settings.'
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

  const action = elements.action.value;
  const newCanBeTipped = action === 'enabled';

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

  const message = tags.length
    ? [
        'Every original post on ',
        createBlogSpan(name),
        ' tagged ',
        ...elementsAsList(tags.map(createTagSpan), 'or'),
        ' will have tipping ',
        dom('span', { style: 'font-weight: bold;' }, null, [action]),
        '.'
      ]
    : [
        'Every published post on ',
        createBlogSpan(name),
        ' will have tipping ',
        dom('span', { style: 'font-weight: bold;' }, null, [action]),
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
        { click: () => togglePosts({ uuid, name, tags, newCanBeTipped }).catch(showError) },
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

const showPostsNotFound = ({ name, newCanBeTipped }) =>
  showModal({
    title: 'No posts found!',
    message: [
      `It looks like you don't have any original posts with tipping ${newCanBeTipped ? 'disabled' : 'enabled'} on `,
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

const togglePosts = async ({ uuid, name, tags, newCanBeTipped }) => {
  const gatherStatus = dom('span', null, null, ['Gathering posts...']);
  const toggleStatus = dom('span');

  showModal({
    title: `${newCanBeTipped ? 'Enabling' : 'Disabling'} tipping on posts...`,
    message: [
      dom('small', null, null, ['Do not navigate away from this page.']),
      '\n\n',
      gatherStatus,
      toggleStatus
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
            .filter(({ rebloggedRootId }) => !rebloggedRootId)
            .filter(({ canBeTipped }) => canBeTipped !== newCanBeTipped)
            .forEach((postData) => filteredPostsMap.set(postData.id, postData));

          resource = response.links?.next?.href;

          gatherStatus.textContent = `Found ${filteredPostsMap.size} posts (checked ${allPostIdsSet.size})${resource ? '...' : '.'}`;
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
    showPostsNotFound({ name, newCanBeTipped });
    return;
  }

  let toggledCount = 0;
  let toggledFailCount = 0;

  // temp
  filteredPostsMap.forEach(postData => console.log(postData));
  return;

  for (const [id, postData] of filteredPostsMap.entries()) {
    toggleStatus.textContent = `${newCanBeTipped ? 'Enabling' : 'Disabling'} tipping on post with ID ${id}...`;
    try {
      const {
        content = [],
        layout,
        state = 'published',
        publishOn,
        date,
        tags = [],
        sourceUrlRaw,
        slug = ''
      } = postData;

      await Promise.all([
        apiFetch(`/v2/blog/${uuid}/posts/${id}`, {
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
            canBeTipped: newCanBeTipped
          }
        }),
        sleep(1000)
      ]);
      toggledCount++;
    } catch (exception) {
      console.error(exception);
      toggledFailCount++;
    }
  }

  await sleep(1000);

  showModal({
    title: 'All done!',
    message: [
      `${newCanBeTipped ? 'Enabled' : 'Disabled'} tipping on ${toggledCount} posts${toggledFailCount ? ` (failed: ${toggledFailCount})` : ''}.\n`,
      'Refresh the page to see the result.'
    ],
    buttons: [
      dom('button', null, { click: hideModal }, ['Close']),
      dom('button', { class: 'blue' }, { click: () => location.reload() }, ['Refresh'])
    ]
  });
};

const sidebarOptions = {
  id: 'mass-tip-toggler',
  title: 'Mass Tip Toggler',
  rows: [{
    label: 'Toggle tipping on original posts',
    onclick: showInitialPrompt,
    carrot: true
  }],
  visibility: () => /^\/blog\/[^/]+\/?$/.test(location.pathname)
};

export const main = async () => addSidebarItem(sidebarOptions);
export const clean = async () => removeSidebarItem(sidebarOptions.id);
export const stylesheet = true;
