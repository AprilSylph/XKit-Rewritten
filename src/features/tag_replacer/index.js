import { dom } from '../../utils/dom.js';
import { megaEdit } from '../../utils/mega_editor.js';
import { showModal, modalCancelButton, modalCompleteButton, showErrorModal } from '../../utils/modals.js';
import { addSidebarItem, removeSidebarItem } from '../../utils/sidebar.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';
import { userBlogs } from '../../utils/user.js';

const getPostsFormId = 'xkit-tag-replacer-get-posts';

const createBlogOption = ({ name, title, uuid }) => dom('option', { value: uuid, title }, null, [name]);
const createTagSpan = tag => dom('span', { class: 'tag-replacer-tag' }, null, [tag]);
const createBlogSpan = name => dom('span', { class: 'tag-replacer-blog' }, null, [name]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const showInitialPrompt = async () => {
  const initialForm = dom('form', { id: getPostsFormId }, { submit: event => confirmReplaceTag(event).catch(showErrorModal) }, [
    dom('label', null, null, [
      'Replace tags on:',
      dom('select', { name: 'blog', required: true }, null, userBlogs.map(createBlogOption))
    ]),
    dom('label', null, null, [
      'Remove this tag:',
      dom('input', { type: 'text', name: 'oldTag', required: true, placeholder: 'Required', autocomplete: 'off' })
    ]),
    dom('label', null, null, [
      'Add new tag/tags:',
      dom('input', { type: 'text', name: 'newTag', placeholder: 'Optional, comma-separated', autocomplete: 'off' })
    ])
  ]);

  if (location.pathname.startsWith('/blog/')) {
    const name = location.pathname.split('/')[2];
    const option = [...initialForm.elements.blog.options].find(({ textContent }) => textContent === name);
    if (option) option.selected = true;
  }

  const submitButton = dom('input', { class: 'blue', type: 'submit', form: getPostsFormId, value: 'Replace Tag', disabled: true });
  const updateSubmitButton = () => {
    const { mode } = processTagInputs(initialForm.elements.oldTag, initialForm.elements.newTag);
    if (mode) {
      submitButton.disabled = false;
      submitButton.className = {
        add: 'blue',
        remove: 'red',
        replace: 'blue'
      }[mode];
      submitButton.value = {
        add: 'Add Tags',
        remove: 'Remove Tag',
        replace: 'Replace Tag'
      }[mode];
    } else {
      submitButton.disabled = true;
    }
  };
  initialForm.elements.oldTag.addEventListener('input', updateSubmitButton);
  initialForm.elements.newTag.addEventListener('input', updateSubmitButton);

  showModal({
    title: 'Replace what tag?',
    message: [
      initialForm,
      dom('small', null, null, [
        'This tool uses the Mass Post Editor API to process posts in bulk.\n',
        'Any new tags will be added to the end of each post\'s tags.'
      ])
    ],
    buttons: [modalCancelButton, submitButton]
  });
};

const processTagInputs = (oldTagInput, newTagInput) => {
  const oldTags = oldTagInput.value
    .replace(/"|#/g, '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
  const newTags = newTagInput.value
    .replace(/"|#/g, '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  if (oldTags.length === 1) {
    const oldTag = oldTags[0];

    const toAdd = newTags.filter(tag => tag.toLowerCase() !== oldTag.toLowerCase());
    const toRemove = newTags.some(tag => tag.toLowerCase() === oldTag.toLowerCase()) ? [] : [oldTag];

    if (toAdd.length && toRemove.length) return { mode: 'replace', oldTag, toAdd, toRemove };
    if (toAdd.length) return { mode: 'add', oldTag, toAdd, toRemove };
    if (toRemove.length) return { mode: 'remove', oldTag, toAdd, toRemove };
  }
  return {};
};

const confirmReplaceTag = async event => {
  event.preventDefault();

  const { submitter } = event;
  if (submitter.matches('input[type="submit"]')) {
    submitter.disabled = true;
    submitter.value = 'Checking...';
  }

  const { elements } = event.currentTarget;

  const uuid = elements.blog.value;
  const name = elements.blog.selectedOptions[0].textContent;

  const { oldTag, toAdd, toRemove, mode } = processTagInputs(elements.oldTag, elements.newTag);

  const { response: { totalPosts } } = await apiFetch(`/v2/blog/${uuid}/posts`, { method: 'GET', queryParams: { tag: oldTag } });
  if (!totalPosts) {
    showTagNotFound({ tag: oldTag, name });
    return;
  }

  const title = {
    add: `Add tags to ${totalPosts} posts?`,
    remove: `Remove tags from ${totalPosts} posts?`,
    replace: `Replace tags on ${totalPosts} posts?`
  }[mode];

  const message = {
    add: [
      'Posts with ',
      createTagSpan(oldTag.toLowerCase()),
      ' on ',
      createBlogSpan(name),
      ` will gain the ${toAdd.length > 1 ? 'tags:\n' : 'tag: '}`,
      ...toAdd.flatMap(tag => [createTagSpan(tag), ' '])
    ],
    remove: [
      'The tag ',
      createTagSpan(oldTag.toLowerCase()),
      ' on ',
      createBlogSpan(name),
      ' will be removed.'
    ],
    replace: [
      'The tag ',
      createTagSpan(oldTag.toLowerCase()),
      ' on ',
      createBlogSpan(name),
      ` will be replaced with the ${toAdd.length > 1 ? 'tags:\n' : 'tag: '}`,
      ...toAdd.flatMap(tag => [createTagSpan(tag), ' '])
    ]
  }[mode];

  const buttonClass = { add: 'blue', remove: 'red', replace: 'blue' }[mode];
  const buttonText = { add: 'Add them!', remove: 'Remove it!', replace: 'Replace it!' }[mode];

  showModal({
    title,
    message,
    buttons: [
      modalCancelButton,
      dom(
        'button',
        { class: buttonClass },
        { click: () => replaceTag({ uuid, oldTag, toAdd, toRemove, mode }).catch(showErrorModal) },
        [buttonText]
      )
    ]
  });
};

const showTagNotFound = ({ tag, name }) => showModal({
  title: 'No posts found!',
  message: ['It looks like you don\'t have any posts tagged ', createTagSpan(tag.toLowerCase()), ' on ', createBlogSpan(name), '.'],
  buttons: [modalCompleteButton]
});

const replaceTag = async ({ uuid, oldTag, toAdd, toRemove }) => {
  const gatherStatus = dom('span', null, null, ['Gathering posts...']);
  const removeStatus = dom('span');
  const appendStatus = dom('span');

  showModal({
    title: 'This shouldn\'t take too long...',
    message: [
      dom('small', null, null, ['Do not navigate away from this page.']),
      '\n\n',
      gatherStatus,
      appendStatus,
      removeStatus
    ]
  });

  const taggedPosts = [];
  let resource = `/v2/blog/${uuid}/posts?${$.param({ tag: oldTag, limit: 50 })}`;

  while (resource) {
    await Promise.all([
      apiFetch(resource).then(({ response }) => {
        const posts = response.posts.filter(({ canEdit }) => canEdit === true);
        taggedPosts.push(...posts);
        resource = response.links?.next?.href;

        gatherStatus.textContent = `Found ${taggedPosts.length} posts${resource ? '...' : '.'}`;
      }),
      sleep(1000)
    ]);
  }

  const taggedPostIds = taggedPosts.map(({ id }) => id);
  let appendedCount = 0;
  let appendedFailCount = 0;
  let removedCount = 0;
  let removedFailCount = 0;

  while (taggedPostIds.length !== 0) {
    const postIds = taggedPostIds.splice(0, 100);

    if (toAdd.length) {
      if (appendStatus.textContent === '') appendStatus.textContent = '\nAdding new tags...';

      await Promise.all([
        megaEdit(postIds, { mode: 'add', tags: toAdd }).then(() => {
          appendedCount += postIds.length;
        }).catch(() => {
          appendedFailCount += postIds.length;
        }).finally(() => {
          appendStatus.textContent = `\nAdded new tags to ${appendedCount} posts... ${appendedFailCount ? `(failed: ${appendedFailCount})` : ''}`;
        }),
        sleep(1000)
      ]);
    }

    if (toRemove.length) {
      if (removeStatus.textContent === '') removeStatus.textContent = '\nRemoving old tags...';

      await Promise.all([
        megaEdit(postIds, { mode: 'remove', tags: toRemove }).then(() => {
          removedCount += postIds.length;
        }).catch(() => {
          removedFailCount += postIds.length;
        }).finally(() => {
          removeStatus.textContent = `\nRemoved old tags from ${removedCount} posts... ${removedFailCount ? `(failed: ${removedFailCount})` : ''}`;
        }),
        sleep(1000)
      ]);
    }
  }

  await sleep(1000);

  showModal({
    title: 'Thank you, come again!',
    message: [
      toAdd.length ? `Added new tags to ${appendedCount} posts${appendedFailCount ? ` (failed: ${appendedFailCount})` : ''}.\n` : '',
      toRemove.length ? `Removed old tags from ${removedCount} posts${removedFailCount ? ` (failed: ${removedFailCount})` : ''}.` : ''
    ],
    buttons: [
      modalCompleteButton
    ]
  });
};

const sidebarOptions = {
  id: 'tag-replacer',
  title: 'Tag Replacer',
  rows: [{
    label: 'Replace a tag',
    onclick: showInitialPrompt,
    carrot: true
  }]
};

export const main = async () => addSidebarItem(sidebarOptions);
export const clean = async () => removeSidebarItem(sidebarOptions.id);
export const stylesheet = true;
