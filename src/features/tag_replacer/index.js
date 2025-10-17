import { button, form, input, label, option, select, small, span } from '../../utils/dom.js';
import { megaEdit } from '../../utils/mega_editor.js';
import { showModal, modalCancelButton, modalCompleteButton, showErrorModal, createTagSpan, createBlogSpan } from '../../utils/modals.js';
import { addSidebarItem, removeSidebarItem } from '../../utils/sidebar.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';
import { userBlogs } from '../../utils/user.js';

const getPostsFormId = 'xkit-tag-replacer-get-posts';

const createBlogOption = ({ name, title, uuid }) => option({ value: uuid, title }, [name]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const showInitialPrompt = async () => {
  const initialForm = form({ id: getPostsFormId, submit: event => confirmReplaceTag(event).catch(showErrorModal) }, [
    label({}, [
      'Replace tags on:',
      select({ name: 'blog', required: true }, userBlogs.map(createBlogOption))
    ]),
    label({}, [
      'Remove this tag:',
      input({ type: 'text', name: 'oldTag', required: true, placeholder: 'Required', autocomplete: 'off' })
    ]),
    label({}, [
      'Add this new tag:',
      input({ type: 'text', name: 'newTag', placeholder: 'Optional, comma-separated', autocomplete: 'off' })
    ])
  ]);

  if (location.pathname.startsWith('/blog/')) {
    const name = location.pathname.split('/')[2];
    const option = [...initialForm.elements.blog.options].find(({ textContent }) => textContent === name);
    if (option) option.selected = true;
  }

  showModal({
    title: 'Replace what tag?',
    message: [
      initialForm,
      small({}, [
        'This tool uses the Mass Post Editor API to process posts in bulk.\n',
        'Any new tags will be added to the end of each post\'s tags.'
      ])
    ],
    buttons: [
      modalCancelButton,
      input({ class: 'blue', type: 'submit', form: getPostsFormId, value: 'Next' })
    ]
  });
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
  const oldTag = elements.oldTag.value.replace(/,|"|#/g, '').trim();

  const { response: { totalPosts } } = await apiFetch(`/v2/blog/${uuid}/posts`, { method: 'GET', queryParams: { tag: oldTag } });
  if (!totalPosts) {
    showTagNotFound({ tag: oldTag, name });
    return;
  }

  const newTag = elements.newTag.value.replace(/"|#/g, '').trim();
  const remove = newTag === '';

  const newTags = newTag.split(',').map(tag => tag.trim());
  const newMultiple = newTags.length > 1;

  const appendOnly = newTags.some(tag => tag.toLowerCase() === oldTag.toLowerCase());

  showModal({
    title: `${remove ? 'Remove' : 'Replace'} tags on ${totalPosts} posts?`,
    message: [
      'The tag ',
      createTagSpan(oldTag.toLowerCase()),
      ' on ',
      createBlogSpan(name),
      ' will be ',
      ...remove
        ? ['removed.']
        : [`replaced with the ${newMultiple ? 'tags:\n' : 'tag: '}`, ...newTags.flatMap(tag => [createTagSpan(tag), ' '])]
    ],
    buttons: [
      modalCancelButton,
      button(
        {
          class: remove ? 'red' : 'blue',
          click: () => replaceTag({ uuid, oldTag, newTag, appendOnly }).catch(showErrorModal)
        },
        [remove ? 'Remove it!' : 'Replace it!']
      )
    ]
  });
};

const showTagNotFound = ({ tag, name }) => showModal({
  title: 'No posts found!',
  message: ['It looks like you don\'t have any posts tagged ', createTagSpan(tag.toLowerCase()), ' on ', createBlogSpan(name), '.'],
  buttons: [modalCompleteButton]
});

const replaceTag = async ({ uuid, oldTag, newTag, appendOnly }) => {
  const gatherStatus = span({}, ['Gathering posts...']);
  const removeStatus = span();
  const appendStatus = span();

  showModal({
    title: 'This shouldn\'t take too long...',
    message: [
      small({}, ['Do not navigate away from this page.']),
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

    if (newTag) {
      if (appendStatus.textContent === '') appendStatus.textContent = '\nAdding new tags...';

      await Promise.all([
        megaEdit(postIds, { mode: 'add', tags: [newTag] }).then(() => {
          appendedCount += postIds.length;
        }).catch(() => {
          appendedFailCount += postIds.length;
        }).finally(() => {
          appendStatus.textContent = `\nAdded new tags to ${appendedCount} posts... ${appendedFailCount ? `(failed: ${appendedFailCount})` : ''}`;
        }),
        sleep(1000)
      ]);
    }

    if (!appendOnly) {
      if (removeStatus.textContent === '') removeStatus.textContent = '\nRemoving old tags...';

      await Promise.all([
        megaEdit(postIds, { mode: 'remove', tags: [oldTag] }).then(() => {
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
      newTag ? `Added new tags to ${appendedCount} posts${appendedFailCount ? ` (failed: ${appendedFailCount})` : ''}.\n` : '',
      !appendOnly ? `Removed old tags from ${removedCount} posts${removedFailCount ? ` (failed: ${removedFailCount})` : ''}.` : ''
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
