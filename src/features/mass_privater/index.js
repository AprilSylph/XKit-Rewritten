import { button, form, input, label, option, select, small, span } from '../../utils/dom.js';
import { megaEdit } from '../../utils/mega_editor.js';
import { showModal, modalCancelButton, modalCompleteButton, hideModal, showErrorModal, createTagSpan, createBlogSpan } from '../../utils/modals.js';
import { addSidebarItem, removeSidebarItem } from '../../utils/sidebar.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';
import { userBlogs } from '../../utils/user.js';

const getPostsFormId = 'xkit-mass-privater-get-posts';

const createBlogOption = ({ name, title, uuid }) => option({ value: uuid, title }, [name]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const dateTimeFormat = new Intl.DateTimeFormat(document.documentElement.lang, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  timeZoneName: 'short'
});

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

const showInitialPrompt = async () => {
  const initialForm = form({ id: getPostsFormId, submit: event => confirmInitialPrompt(event).catch(showErrorModal) }, [
    label({}, [
      'Posts on blog:',
      select({ name: 'blog', required: true }, userBlogs.map(createBlogOption))
    ]),
    label({}, [
      'Posts from before:',
      input({ type: 'datetime-local', name: 'before', value: createNowString(), required: true })
    ]),
    label({}, [
      small({}, ['Posts with any of these tags (optional):']),
      input({ type: 'text', name: 'tags', placeholder: 'Comma-separated', autocomplete: 'off' })
    ])
  ]);

  if (location.pathname.startsWith('/blog/')) {
    const blogName = location.pathname.split('/')[2];
    const option = [...initialForm.elements.blog.options].find(({ textContent }) => textContent === blogName);
    if (option) option.selected = true;
  }

  showModal({
    title: 'Select posts to make private',
    message: [initialForm],
    buttons: [
      modalCancelButton,
      input({ class: 'blue', type: 'submit', form: getPostsFormId, value: 'Next' })
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

  const beforeMs = elements.before.valueAsNumber + timezoneOffsetMs;

  const beforeString = dateTimeFormat.format(new Date(beforeMs));
  const beforeElement = span({ style: 'white-space: nowrap; font-weight: bold;' }, [beforeString]);

  const before = beforeMs / 1000;

  const message = tags.length
    ? [
        'Every published post on ',
        createBlogSpan(name),
        ' from before ',
        beforeElement,
        ' tagged ',
        ...elementsAsList(tags.map(createTagSpan), 'or'),
        ' will be set to private.'
      ]
    : [
        'Every published post on ',
        createBlogSpan(name),
        ' from before ',
        beforeElement,
        ' will be set to private.'
      ];

  showModal({
    title: 'Are you sure?',
    message,
    buttons: [
      modalCancelButton,
      button(
        {
          class: 'red',
          click: () => privatePosts({ uuid, name, tags, before }).catch(showErrorModal)
        },
        ['Private them!']
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
      "It looks like you don't have any posts with the specified criteria on ",
      createBlogSpan(name),
      '.'
    ],
    buttons: [modalCompleteButton]
  });

const privatePosts = async ({ uuid, name, tags, before }) => {
  const gatherStatus = span({}, ['Gathering posts...']);
  const privateStatus = span();

  showModal({
    title: 'Making posts private...',
    message: [
      small({}, ['Do not navigate away from this page.']),
      '\n\n',
      gatherStatus,
      privateStatus
    ]
  });

  let fetchedPosts = 0;
  const filteredPostIdsSet = new Set();

  const collect = async resource => {
    while (resource) {
      await Promise.all([
        apiFetch(resource).then(({ response }) => {
          response.posts
            .filter(({ canEdit }) => canEdit === true)
            .filter(({ state }) => state === 'published')
            .filter(({ timestamp }) => timestamp < before)
            .forEach(({ id }) => filteredPostIdsSet.add(id));

          fetchedPosts += response.posts.length;

          resource = response.links?.next?.href;

          gatherStatus.textContent = `Found ${filteredPostIdsSet.size} posts (checked ${fetchedPosts})${resource ? '...' : '.'}`;
        }),
        sleep(1000)
      ]);
    }
  };

  if (tags.length) {
    for (const tag of tags) {
      await collect(`/v2/blog/${uuid}/posts?${$.param({ tag, before, limit: 50 })}`);
    }
  } else {
    await collect(`/v2/blog/${uuid}/posts?${$.param({ before, limit: 50 })}`);
  }
  const filteredPostIds = [...filteredPostIdsSet];

  if (filteredPostIds.length === 0) {
    showPostsNotFound({ name });
    return;
  }

  let privatedCount = 0;
  let privatedFailCount = 0;

  while (filteredPostIds.length !== 0) {
    const postIds = filteredPostIds.splice(0, 100);

    if (privateStatus.textContent === '') privateStatus.textContent = '\nPrivating posts...';

    await Promise.all([
      megaEdit(postIds, { mode: 'private' }).then(() => {
        privatedCount += postIds.length;
      }).catch(() => {
        privatedFailCount += postIds.length;
      }).finally(() => {
        privateStatus.textContent = `\nPrivated ${privatedCount} posts... ${privatedFailCount ? `(failed: ${privatedFailCount})` : ''}`;
      }),
      sleep(1000)
    ]);
  }

  await sleep(1000);

  showModal({
    title: 'All done!',
    message: [
      `Privated ${privatedCount} posts${privatedFailCount ? ` (failed: ${privatedFailCount})` : ''}.\n`,
      'Refresh the page to see the result.'
    ],
    buttons: [
      button({ click: hideModal }, ['Close']),
      button({ class: 'blue', click: () => location.reload() }, ['Refresh'])
    ]
  });
};

const sidebarOptions = {
  id: 'mass-privater',
  title: 'Mass Privater',
  rows: [{
    label: 'Make posts private',
    onclick: showInitialPrompt,
    carrot: true
  }],
  visibility: () => /^\/blog\/[^/]+\/?$/.test(location.pathname)
};

export const main = async () => addSidebarItem(sidebarOptions);
export const clean = async () => removeSidebarItem(sidebarOptions.id);
