import { dom } from '../../utils/dom.js';
import { megaEdit } from '../../utils/mega_editor.js';
import { showModal, modalCancelButton, modalCompleteButton, hideModal, showErrorModal, createTagSpan, createBlogSpan } from '../../utils/modals.js';
import { addSidebarItem, removeSidebarItem } from '../../utils/sidebar.js';
import { dateTimeFormat, elementsAsList } from '../../utils/text_format.js';
import { apiFetch, createEditRequestBody, isNpfCompatible } from '../../utils/tumblr_helpers.js';
import { userBlogs } from '../../utils/user.js';

const getPostsFormId = 'xkit-mass-privater-get-posts';

const createBlogOption = ({ name, title, uuid }) => dom('option', { value: uuid, title }, null, [name]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const timezoneOffsetMs = new Date().getTimezoneOffset() * 60000;

const createNowString = () => {
  const now = new Date();

  const YYYY = `${now.getFullYear()}`.padStart(4, '0');
  const MM = `${now.getMonth() + 1}`.padStart(2, '0');
  const DD = `${now.getDate()}`.padStart(2, '0');
  const hh = `${now.getHours()}`.padStart(2, '0');
  const mm = `${now.getMinutes()}`.padStart(2, '0');

  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
};

const showInitialPrompt = async (mode) => {
  const initialForm = dom('form', { id: getPostsFormId }, { submit: event => confirmInitialPrompt(event, mode).catch(showErrorModal) }, [
    dom('label', null, null, [
      'Posts on blog:',
      dom('select', { name: 'blog', required: true }, null, userBlogs.map(createBlogOption)),
    ]),
    dom('label', null, null, [
      'Posts from before:',
      dom('input', { type: 'datetime-local', name: 'before', value: createNowString(), required: true }),
    ]),
    dom('label', null, null, [
      dom('small', null, null, ['Posts with any of these tags (optional):']),
      dom('input', { type: 'text', name: 'tags', placeholder: 'Comma-separated', autocomplete: 'off' }),
    ]),
  ]);

  if (location.pathname.startsWith('/blog/')) {
    const blogName = location.pathname.split('/')[2];
    const option = [...initialForm.elements.blog.options].find(({ textContent }) => textContent === blogName);
    if (option) option.selected = true;
  }

  showModal({
    title: `Select posts to make ${mode}`,
    message: [initialForm],
    buttons: [
      modalCancelButton,
      dom('input', { class: 'blue', type: 'submit', form: getPostsFormId, value: 'Next' }),
    ],
  });
};

const confirmInitialPrompt = async (event, mode) => {
  event.preventDefault();

  const { submitter } = event;
  if (submitter.matches('input[type="submit"]')) {
    submitter.disabled = true;
    submitter.value = 'Checking...';
  }

  const { elements } = event.currentTarget;

  const uuid = elements.blog.value;
  const name = elements.blog.selectedOptions[0].textContent;
  const tags = elements.tags.value
    .replace(/"|#/g, '')
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(Boolean);

  if (mode === 'private' && tags.length) {
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

  const beforeMs = elements.before.valueAsNumber + timezoneOffsetMs;

  const beforeString = dateTimeFormat.format(new Date(beforeMs));
  const beforeElement = dom('span', { style: 'white-space: nowrap; font-weight: bold;' }, null, [beforeString]);

  const before = beforeMs / 1000;

  const message = tags.length
    ? [
        `Every ${mode === 'private' ? 'published' : 'private'} post on `,
        createBlogSpan(name),
        ' from before ',
        beforeElement,
        ' tagged ',
        ...elementsAsList(tags.map(createTagSpan), 'or'),
        ` will be set to ${mode}.`,
      ]
    : [
        `Every ${mode === 'private' ? 'published' : 'private'} post on `,
        createBlogSpan(name),
        ' from before ',
        beforeElement,
        ` will be set to ${mode}.`,
      ];

  showModal({
    title: 'Are you sure?',
    message,
    buttons: [
      modalCancelButton,
      dom(
        'button',
        { class: 'red' },
        { click: () => editPosts({ mode, uuid, name, tags, before }).catch(showErrorModal) },
        [mode === 'private' ? 'Private them!' : 'Unprivate them!'],
      ),
    ],
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
      '. Did you misspell a tag?',
    ],
    buttons: [modalCompleteButton],
  });

const showPostsNotFound = ({ name }) =>
  showModal({
    title: 'No posts found!',
    message: [
      "It looks like you don't have any posts with the specified criteria on ",
      createBlogSpan(name),
      '.',
    ],
    buttons: [modalCompleteButton],
  });

const dateFormat = new Intl.DateTimeFormat(document.documentElement.lang, { dateStyle: 'medium' });

const editPosts = async ({ mode, uuid, name, tags, before }) => {
  const gatherStatus = dom('span', null, null, ['Gathering posts...']);
  const editStatus = dom('span');

  const failedTable = dom('div', { class: 'mass-privater-failed-table' });
  const failedTableWrapper = dom('form', { class: 'mass-privater-failed-table-wrapper' }, null, [failedTable]);
  const showFailedPost = ({ blogName, id, timestamp, summary = '' }) =>
    failedTable.append(
      dom('div', { class: 'date' }, null, [
        dom('a', { href: `/@${blogName}/${id}`, target: '_blank' }, null, [dateFormat.format(new Date(timestamp * 1000))]),
      ]),
      dom('div', { class: 'summary' }, null, [
        summary.replaceAll('\n', ' '),
      ]),
    );
  const failedStatus = dom('div', { class: 'mass-privater-failed' }, null, [
    'Failed/incompatible posts:',
    failedTableWrapper,
  ]);

  showModal({
    title: `Making posts ${mode}...`,
    message: [
      dom('small', null, null, ['Do not navigate away from this page.']),
      '\n\n',
      gatherStatus,
      editStatus,
      failedStatus,
    ],
  });

  let fetchedPosts = 0;
  const filteredPostsMap = new Map();

  const collect = async resource => {
    while (resource) {
      await Promise.all([
        apiFetch(resource).then(({ response }) => {
          response.posts
            .filter(({ canEdit }) => canEdit === true)
            .filter(({ state }) => state === (mode === 'private' ? 'published' : 'private'))
            .filter(({ timestamp }) => timestamp < before)
            .filter(postData =>
              tags.length
                ? postData.tags.some(tag => tags.includes(tag.toLowerCase()))
                : true,
            )
            .forEach((postData) => filteredPostsMap.set(postData.id, postData));

          fetchedPosts += response.posts.length;

          resource = response.links?.next?.href;

          gatherStatus.textContent = `Found ${filteredPostsMap.size} posts (checked ${fetchedPosts})${resource ? '...' : '.'}`;
        }),
        sleep(1000),
      ]);
    }
  };

  if (mode === 'private' && tags.length) {
    for (const tag of tags) {
      await collect(`/v2/blog/${uuid}/posts?${$.param({ tag, before, limit: 50 })}`);
    }
  } else {
    await collect(`/v2/blog/${uuid}/posts?${$.param({ before, limit: 50 })}`);
  }

  if (filteredPostsMap.size === 0) {
    showPostsNotFound({ name });
    return;
  }

  let successCount = 0;
  let failCount = 0;

  if (mode === 'private') {
    editStatus.textContent = '\nPrivating posts...';

    const filteredPostIds = [...filteredPostsMap.keys()];
    while (filteredPostIds.length !== 0) {
      const postIds = filteredPostIds.splice(0, 100);

      await Promise.all([
        megaEdit(postIds, { mode: 'private' }).then(() => {
          successCount += postIds.length;
        }).catch(() => {
          failCount += postIds.length;
        }).finally(() => {
          editStatus.textContent = `\nPrivated ${successCount} posts... ${failCount ? `(failed: ${failCount})` : ''}`;
        }),
        sleep(1000),
      ]);
    }
  } else {
    editStatus.textContent = '\nUnprivating posts...';

    const filteredPosts = [...filteredPostsMap.values()];
    const editablePosts = [];
    filteredPosts.forEach(postData => isNpfCompatible(postData)
      ? editablePosts.push(postData)
      : showFailedPost(postData),
    );
    for (const postData of editablePosts) {
      await Promise.all([
        apiFetch(`/v2/blog/${uuid}/posts/${postData.id}`, {
          method: 'PUT',
          body: {
            ...createEditRequestBody(postData),
            state: 'published',
          },
        }).then(() => {
          successCount++;
        }).catch(() => {
          showFailedPost(postData);
          failCount++;
        }).finally(() => {
          editStatus.textContent = `\nUnprivated ${successCount} posts... ${failCount ? `(failed: ${failCount})` : ''}`;
        }),
        sleep(1000),
      ]);
    }
  }

  await sleep(1000);

  const wrapperScrollTop = failedTableWrapper.scrollTop;

  showModal({
    title: 'All done!',
    message: [
      `${mode === 'private' ? 'Privated' : 'Unprivated'} ${successCount} posts${failCount ? ` (failed: ${failCount})` : ''}.\n`,
      'Refresh the page to see the result.',
      failedStatus,
    ],
    buttons: [
      dom('button', null, { click: hideModal }, ['Close']),
      dom('button', { class: 'blue' }, { click: () => location.reload() }, ['Refresh']),
    ],
  });

  failedTableWrapper.scrollTop = wrapperScrollTop;
};

const sidebarOptions = {
  id: 'mass-privater',
  title: 'Mass Privater',
  rows: [
    {
      label: 'Private posts',
      onclick: () => showInitialPrompt('private'),
      carrot: true,
    },
    {
      label: 'Unprivate posts',
      onclick: () => showInitialPrompt('public'),
      carrot: true,
    },
  ],
  visibility: () => /^\/blog\/[^/]+\/?$/.test(location.pathname),
};

export const main = async () => addSidebarItem(sidebarOptions);
export const clean = async () => removeSidebarItem(sidebarOptions.id);
export const stylesheet = true;
