import { dom } from '../util/dom.js';
import { megaEdit } from '../util/mega_editor.js';
import { modalCancelButton, modalCompleteButton, showModal } from '../util/modals.js';
import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { apiFetch } from '../util/tumblr_helpers.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const showClearQueuePrompt = () => showModal({
  title: 'Clear your queue?',
  message: [
    'All posts in this blog\'s queue will be deleted.\n',
    'Scheduled posts will not be affected.'
  ],
  buttons: [
    modalCancelButton,
    dom('button', { class: 'blue' }, { click: () => clearQueue().catch(showError) }, ['Clear it!'])
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
  addSidebarItem(clearQueueSidebarOptions);
};

export const clean = async function () {
  removeSidebarItem(clearQueueSidebarOptions.id);
};
