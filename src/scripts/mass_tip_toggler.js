import { cloneControlButton, createControlButtonTemplate } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { filterPostElements, postSelector } from '../util/interface.js';
import { showModal, modalCancelButton, modalCompleteButton, hideModal } from '../util/modals.js';
import { onNewPosts } from '../util/mutations.js';
import { notify } from '../util/notifications.js';
import { getPreferences } from '../util/preferences.js';
import { timelineObject } from '../util/react_props.js';
import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { apiFetch, createEditRequestBody } from '../util/tumblr_helpers.js';
import { userBlogs } from '../util/user.js';

const getPostsFormId = 'xkit-mass-tip-toggler-get-posts';

const createBlogOption = ({ name, title, uuid }) => dom('option', { value: uuid, title }, null, [name]);
const createTagSpan = tag => dom('span', { class: 'mass-tip-toggler-tag' }, null, [tag]);
const createBlogSpan = name => dom('span', { class: 'mass-tip-toggler-blog' }, null, [name]);
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
    'This toggles the visibility of the tipping button on your original posts that match the chosen criteria. It has no effect unless you enable tipping in Tumblr settings.',
    dom('label', null, null, [
      'Action:',
      dom('select', { name: 'action', required: true }, null, [
        dom('option', { value: 'enabled', title: 'Enable the tip button' }, null, ['Enable the tip button']),
        dom('option', { value: 'disabled', title: 'Disable the tip button' }, null, ['Disable the tip button'])
      ])
    ]),
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
    ]),
    '[Explanation or link to explanation of how the "Add tip button to your posts by default" setting works goes here.]'
  ]);

  if (location.pathname.startsWith('/blog/')) {
    const blogName = location.pathname.split('/')[2];
    const option = [...initialForm.elements.blog.options].find(({ textContent }) => textContent === blogName);
    if (option) option.selected = true;
  }

  showModal({
    title: 'Enable/disable tipping in bulk:',
    message: [
      initialForm,
      dom('small', null, null, [
        'Note: This may take a long time (~3300 posts/hour).'
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

  const afterMs = elements.after.valueAsNumber + timezoneOffsetMs;

  const afterString = dateTimeFormat.format(new Date(afterMs));
  const afterElement = dom('span', { style: 'white-space: nowrap; font-weight: bold;' }, null, [afterString]);

  const after = afterMs / 1000;

  const message = tags.length
    ? [
        'Every original post on ',
        createBlogSpan(name),
        ' tagged ',
        ...elementsAsList(tags.map(createTagSpan), 'or'),
        ' from after ',
        afterElement,
        ' will have tipping ',
        dom('span', { style: 'font-weight: bold;' }, null, [action]),
        '.'
      ]
    : [
        'Every published post on ',
        createBlogSpan(name),
        ' from after ',
        afterElement,
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
        { click: () => togglePosts({ uuid, name, tags, after, newCanBeTipped }).catch(showError) },
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

const togglePosts = async ({ uuid, name, tags, after, newCanBeTipped }) => {
  const gatherStatus = dom('span', null, null, ['Gathering posts...']);
  const toggleStatus = dom('span');

  showModal({
    title: `${newCanBeTipped ? 'Enabling' : 'Disabling'} tipping on posts...`,
    message: [
      dom('small', null, null, ['Do not navigate away from this page.']),
      '\n\n',
      gatherStatus,
      '\n',
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
            .filter(({ timestamp }) => timestamp > after)
            .filter(({ canBeTipped }) => canBeTipped !== newCanBeTipped)
            .forEach((postData) => filteredPostsMap.set(postData.id, postData));

          const done = !posts.some(({ timestamp }) => timestamp > after);

          resource = done ? false : response.links?.next?.href;

          gatherStatus.textContent =
            `Found ${filteredPostsMap.size} posts (checked ${allPostIdsSet.size})${resource ? '...' : '.'}`;
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

  for (const [id, postData] of filteredPostsMap.entries()) {
    try {
      await Promise.all([
        apiFetch(`/v2/blog/${uuid}/posts/${id}`, {
          method: 'PUT',
          body: {
            ...createEditRequestBody(postData),
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
    toggleStatus.textContent = `${newCanBeTipped ? 'Enabled' : 'Disabled'} tipping on on ${toggledCount} posts... ${toggledFailCount ? `(failed: ${toggledFailCount})` : ''}`;
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
    label: 'Toggle tipping in bulk',
    onclick: showInitialPrompt,
    carrot: true
  }],
  visibility: () => /^\/blog\/[^/]+\/?$/.test(location.pathname)
};

const buttonClass = 'xkit-quick-tip-button';
const warningClass = 'xkit-quick-tip-warning';
const warningTextClass = 'xkit-quick-tip-warning-text';

const symbolId = 'ri-currency-line';

let controlButtonTemplate;

let showIfCanBeTipped;
let newCanBeTipped;

const onButtonClicked = async function ({ currentTarget: controlButton }) {
  const postElement = controlButton.closest(postSelector);
  const { id, blog: { uuid } } = await timelineObject(postElement);
  const { response: postData } = await apiFetch(`/v2/blog/${uuid}/posts/${id}`);

  try {
    const { response: { displayText } } = await apiFetch(`/v2/blog/${uuid}/posts/${id}`, {
      method: 'PUT',
      body: {
        ...createEditRequestBody(postData),
        canBeTipped: newCanBeTipped
      }
    });

    notify(displayText);

    postElement.querySelector(`.${warningClass}`)?.remove();

    const footerRow = postElement.querySelector(keyToCss('footerRow'));
    const warningElement = dom('div', { class: warningClass }, null, [
      dom('div', { class: warningTextClass }, null, [
        'note: navigate away and back or refresh to see edited tip status!'
      ])
    ]);
    footerRow.after(warningElement);
  } catch ({ body }) {
    notify(body?.errors?.[0]?.detail || 'Failed to set tipping on post!');
  }
};

const processPosts = postElements =>
  filterPostElements(postElements).forEach(async postElement => {
    const existingButton = postElement.querySelector(`.${buttonClass}`);
    if (existingButton !== null) { return; }

    const editButton = postElement.querySelector(
      `footer ${keyToCss('controlIcon')} a[href*="/edit/"]`
    );
    if (!editButton) return;

    const {
      isBlocksPostFormat,
      rebloggedRootId,
      canBeTipped,
      shouldShowTip
    } = await timelineObject(postElement);

    if (rebloggedRootId) return;

    if (isBlocksPostFormat) {
      if (canBeTipped !== showIfCanBeTipped) return;
    } else {
      // untippable legacy posts have canBeTipped: true and shouldShowTip: false
      // this is otherwise indistinguishable from tippable NPF drafts(?)
      const currentTipStatus = canBeTipped && shouldShowTip;
      if (currentTipStatus !== showIfCanBeTipped) return;
    }

    const clonedControlButton = cloneControlButton(controlButtonTemplate, { click: onButtonClicked });
    const controlIcon = editButton.closest(keyToCss('controlIcon'));
    controlIcon.before(clonedControlButton);
  });

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass);

  addSidebarItem(sidebarOptions);

  const { quickToggle, quickToggleMode, quickToggleAction } = await getPreferences('mass_tip_toggler');
  if (quickToggle) {
    showIfCanBeTipped = {
      enabled: true,
      disabled: false
    }[quickToggleMode];

    newCanBeTipped = {
      default: undefined,
      enable: true,
      disable: false
    }[quickToggleAction];

    onNewPosts.addListener(processPosts);
  }
};
export const clean = async function () {
  removeSidebarItem(sidebarOptions.id);
  onNewPosts.removeListener(processPosts);

  $(`.${buttonClass}`).remove();
  $(`.${warningClass}`).remove();
};

export const stylesheet = true;
