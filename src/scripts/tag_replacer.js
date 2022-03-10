import { dom } from '../util/dom.js';
import { megaEdit } from '../util/mega_editor.js';
import { showModal, modalCancelButton, modalCompleteButton } from '../util/modals.js';
import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { apiFetch } from '../util/tumblr_helpers.js';
import { getUserBlogs } from '../util/user.js';

const getPostsFormId = 'xkit-tag-replacer-get-posts';

const createBlogOption = ({ name, title, uuid }) => dom('option', { value: uuid, title }, null, [name]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const showInitialPrompt = async () => {
  const userBlogs = await getUserBlogs();

  const initialForm = dom('form', { id: getPostsFormId }, { submit: confirmReplaceTag }, [
    dom('label', null, null, [
      'Replace tags on:',
      dom('select', { name: 'blog' }, null, userBlogs.map(createBlogOption))
    ]),
    dom('label', null, null, [
      'Remove this tag:',
      dom('input', { type: 'text', name: 'oldTag', required: true, placeholder: '(Required)', autocomplete: 'off' })
    ]),
    dom('label', null, null, [
      'Append this new tag:',
      dom('input', { type: 'text', name: 'newTag', placeholder: 'Leave blank to delete', autocomplete: 'off' })
    ])
  ]);

  if (location.pathname.startsWith('/blog/')) {
    const name = location.pathname.split('/')[2];
    const option = [...initialForm.elements.blog.options].find(({ textContent }) => textContent === name);
    if (option) option.selected = true;
  }

  showModal({
    title: 'Replace what tag?',
    message: [initialForm],
    buttons: [
      modalCancelButton,
      dom('input', { class: 'blue', type: 'submit', form: getPostsFormId, value: 'Next...' })
    ]
  });
};

const confirmReplaceTag = async event => {
  event.preventDefault();
  const { elements } = event.currentTarget;

  const uuid = elements.blog.value;
  const tag = elements.oldTag.value.replace(/,/g, '');

  const { response: { totalPosts } } = await apiFetch(`/v2/blog/${uuid}/posts`, { method: 'GET', queryParams: { tag, limit: 1 } });
  if (!totalPosts) {
    showTagNotFound({ tag });
    return;
  }

  const newTag = elements.newTag.value.replace(/"/g, '');
  const remove = newTag === '';

  const newTags = newTag.split(',').map(tag => tag.trim());
  const newMultiple = newTags.length > 1;

  showModal({
    title: `${remove ? 'Remove' : 'Replace'} tags on ${totalPosts} posts?`,
    message: [
      `The tag #${tag.toLowerCase()} will be `,
      remove ? 'removed.' : `replaced with the ${newMultiple ? 'tags:\n' : 'tag: '}${newTags.map(tag => `#${tag}`).join(' ')}`
    ],
    buttons: [
      modalCancelButton,
      dom(
        'button',
        { class: remove ? 'red' : 'blue' },
        { click: () => replaceTag({ uuid, tag, newTag }) },
        [remove ? 'Remove it!' : 'Replace it!']
      )
    ]
  });
};

const showTagNotFound = ({ tag }) => showModal({
  title: 'No posts found!',
  message: [`It looks like you don't have any posts tagged #${tag}.`],
  buttons: [modalCompleteButton]
});

const replaceTag = async ({ uuid, tag, newTag }) => {
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
  let resource = `/v2/blog/${uuid}/posts?${$.param({ tag, limit: 50 })}`;

  while (resource) {
    const [{ response }] = await Promise.all([apiFetch(resource), sleep(1000)]);
    taggedPosts.push(...response.posts);
    gatherStatus.textContent = `Found ${taggedPosts.length} posts...`;
    resource = response.links?.next?.href;
  }

  gatherStatus.textContent = `Found ${taggedPosts.length} posts tagged #${tag}.`;

  const taggedPostIds = taggedPosts.map(({ id }) => id);
  let appendedCount = 0;
  let appendedFailCount = 0;
  let removedCount = 0;
  let removedFailCount = 0;

  while (taggedPostIds.length !== 0) {
    const postIds = taggedPostIds.splice(0, 100);

    if (newTag) {
      await Promise.all([
        megaEdit(postIds, { mode: 'add', tags: [newTag] }),
        sleep(1000)
      ]).then(() => {
        appendedCount += postIds.length;
      }).catch(() => {
        appendedFailCount += postIds.length;
      });

      appendStatus.textContent = (appendedCount || appendedFailCount)
        ? `\nAdded tags to ${appendedCount} posts (failed: ${appendedFailCount})...`
        : '';
    }

    await Promise.all([
      megaEdit(postIds, { mode: 'remove', tags: [tag] }),
      sleep(1000)
    ]).then(() => {
      removedCount += postIds.length;
    }).catch(() => {
      removedFailCount += postIds.length;
    });

    removeStatus.textContent = (removedCount || removedFailCount)
      ? `\nRemoved tags from ${removedCount} posts (failed: ${removedFailCount})...`
      : '';
  }

  await sleep(1000);

  showModal({
    title: 'Thank you, come again!',
    message: [
      newTag ? `Added tags to ${appendedCount} posts (failed: ${appendedFailCount}).\n` : '',
      `Removed tags from ${removedCount} posts (failed: ${removedFailCount}).`
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
