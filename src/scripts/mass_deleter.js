import { dom } from '../util/dom.js';
import { megaEdit } from '../util/mega_editor.js';
import { modalCancelButton, modalCompleteButton, showModal } from '../util/modals.js';
import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { apiFetch } from '../util/tumblr_helpers.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const createNowString = () => {
  const now = new Date();

  const YYYY = `${now.getFullYear()}`.padStart(4, '0');
  const MM = `${now.getMonth() + 1}`.padStart(2, '0');
  const DD = `${now.getDate()}`.padStart(2, '0');
  const hh = `${now.getHours()}`.padStart(2, '0');
  const mm = `${now.getMinutes()}`.padStart(2, '0');

  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
};

const showDeleteDraftsPrompt = () => {
  const form = dom('form', { id: 'xkit-mass-deleter-delete-drafts' }, { submit: confirmDeleteDrafts }, [
    dom('label', null, null, [
      'Delete drafts before:',
      dom('input', { type: 'datetime-local', name: 'before', value: createNowString(), required: true })
    ])
  ]);

  showModal({
    title: 'Mass Deleter',
    message: [form],
    buttons: [modalCancelButton, dom('input', { type: 'submit', form: form.id, class: 'blue', value: 'Next' })]
  });
};

const confirmDeleteDrafts = event => {
  event.preventDefault();

  const blogName = location.pathname.split('/')[2];
  const { elements } = event.currentTarget;
  const beforeString = elements.before.valueAsDate.toLocaleString();
  const before = elements.before.valueAsNumber / 1000;

  showModal({
    title: 'Delete drafts?',
    message: [`Every draft on this blog dated before ${beforeString} will be deleted.`],
    buttons: [
      modalCancelButton,
      dom(
        'button',
        { class: 'red' },
        { click: () => deleteDrafts({ blogName, before }).catch(showError) },
        ['Delete them!']
      )
    ]
  });
};

const deleteDrafts = async function ({ blogName, before }) {
  const foundPostsElement = dom('span', null, null, ['Gathering drafts...']);
  const deleteCountElement = dom('span');

  showModal({
    title: 'Deleting drafts...',
    message: [
      dom('small', null, null, ['Do not navigate away from this page.']),
      '\n\n',
      foundPostsElement,
      '\n',
      deleteCountElement
    ]
  });

  const drafts = [];
  let resource = `/v2/blog/${blogName}/posts/draft`;

  while (resource) {
    await Promise.all([
      apiFetch(resource).then(({ response }) => {
        drafts.push(...response.posts.filter(({ timestamp }) => timestamp < before));
        resource = response.links?.next?.href;

        foundPostsElement.textContent = `Found ${drafts.length} drafts${resource ? '...' : '.'}`;
      }),
      sleep(1000)
    ]);
  }

  const draftIds = drafts.map(({ id }) => id);
  if (draftIds.length === 0) {
    showNoDraftsError();
    return;
  }

  let deleteCount = 0;
  let failCount = 0;

  deleteCountElement.textContent = 'Deleting drafts...';

  while (draftIds.length !== 0) {
    const postIds = draftIds.splice(0, 100);
    await Promise.all([
      megaEdit(postIds, { mode: 'delete' }).then(() => {
        deleteCount += postIds.length;
      }).catch(() => {
        failCount += postIds.length;
      }).finally(() => {
        deleteCountElement.textContent = `Deleted ${deleteCount} drafts... ${failCount ? `(failed: ${failCount})` : ''}`;
      }),
      sleep(1000)
    ]);
  }

  showModal({
    title: 'All done!',
    message: [
      `Deleted ${deleteCount} drafts. ${failCount ? `(failed: ${failCount})` : ''}\n`,
      'Refresh the page to see the result.'
    ],
    buttons: [
      dom('button', { class: 'blue' }, { click: () => location.reload() }, ['Refresh'])
    ]
  });
};

const showNoDraftsError = () => showModal({
  title: 'Nothing to delete!',
  message: ['No drafts found for the specified time range.'],
  buttons: [modalCompleteButton]
});

const showClearQueuePrompt = () => showModal({
  title: 'Clear your queue?',
  message: [
    'All posts in this blog\'s queue will be deleted.\n',
    'Scheduled posts will not be affected.'
  ],
  buttons: [
    modalCancelButton,
    dom('button', { class: 'red' }, { click: () => clearQueue().catch(showError) }, ['Clear it!'])
  ]
});

const clearQueue = async function () {
  const foundPostsElement = dom('span', null, null, ['Gathering queued posts...']);
  const deleteCountElement = dom('span');

  showModal({
    title: 'Clearing your queue...',
    message: [
      dom('small', null, null, ['Do not navigate away from this page.']),
      '\n\n',
      foundPostsElement,
      '\n',
      deleteCountElement
    ]
  });

  const queuedPosts = [];
  const blogName = location.pathname.split('/')[2];
  let resource = `/v2/blog/${blogName}/posts/queue?limit=50`;

  while (resource) {
    await Promise.all([
      apiFetch(resource).then(({ response }) => {
        queuedPosts.push(...response.posts.filter(({ queuedState }) => queuedState === 'queued'));
        resource = response.links?.next?.href;

        foundPostsElement.textContent = `Found ${queuedPosts.length} queued posts${resource ? '...' : '.'}`;
      }),
      sleep(1000)
    ]);
  }

  const queuedPostIds = queuedPosts.map(({ id }) => id);

  if (queuedPostIds.length === 0) {
    showEmptyQueueError();
    return;
  }

  let deleteCount = 0;
  let failCount = 0;

  deleteCountElement.textContent = 'Deleting queued posts...';

  while (queuedPostIds.length !== 0) {
    const postIds = queuedPostIds.splice(0, 100);
    await Promise.all([
      megaEdit(postIds, { mode: 'delete' }).then(() => {
        deleteCount += postIds.length;
      }).catch(() => {
        failCount += postIds.length;
      }).finally(() => {
        deleteCountElement.textContent = `Deleted ${deleteCount} queued posts... ${failCount ? `(failed: ${failCount})` : ''}`;
      }),
      sleep(1000)
    ]);
  }

  showModal({
    title: 'All done!',
    message: [
      `Deleted ${deleteCount} queued posts. ${failCount ? `(failed: ${failCount})` : ''}\n`,
      'Refresh the page to see the result.'
    ],
    buttons: [
      dom('button', { class: 'blue' }, { click: () => location.reload() }, ['Refresh'])
    ]
  });
};

const showEmptyQueueError = () => showModal({
  title: 'No queued posts!',
  message: 'Looks like there is nothing to clear here.',
  buttons: [modalCompleteButton]
});

const showError = exception => showModal({
  title: 'Something went wrong.',
  message: [exception.message],
  buttons: [modalCompleteButton]
});

const deleteDraftsSidebarOptions = {
  id: 'mass-deleter-delete-drafts',
  title: 'Mass Deleter',
  rows: [{
    label: 'Delete drafts',
    onclick: showDeleteDraftsPrompt,
    carrot: true
  }],
  visibility: () => /\/blog\/.+\/drafts/.test(location.pathname)
};

const clearQueueSidebarOptions = {
  id: 'mass-deleter-clear-queue',
  title: 'Mass Deleter',
  rows: [{
    label: 'Clear queue',
    onclick: showClearQueuePrompt,
    carrot: true
  }],
  visibility: () => /\/blog\/.+\/queue/.test(location.pathname)
};

export const main = async function () {
  addSidebarItem(deleteDraftsSidebarOptions);
  addSidebarItem(clearQueueSidebarOptions);
};

export const clean = async function () {
  removeSidebarItem(deleteDraftsSidebarOptions.id);
  removeSidebarItem(clearQueueSidebarOptions.id);
};
