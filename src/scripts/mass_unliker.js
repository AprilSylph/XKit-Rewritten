import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { showModal, modalCancelButton, modalCompleteButton } from '../util/modals.js';
import { apiFetch } from '../util/tumblr_helpers.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const gatherStatusElement = document.createElement('span');
const unlikeStatusElement = document.createElement('span');

const gatherLikes = async function () {
  const likes = [];
  let resource = '/v2/user/likes';

  while (resource) {
    const { response } = await apiFetch(resource);
    likes.push(...response.likedPosts);
    gatherStatusElement.textContent = `Found ${likes.length} liked posts...`;
    resource = response.links?.next?.href;
  }

  gatherStatusElement.textContent = `Found ${likes.length} liked posts.`;
  return likes;
};

const unlikePosts = async function () {
  gatherStatusElement.textContent = 'Gathering likes...';
  const likes = await gatherLikes();
  let unlikedCount = 0;
  let failureCount = 0;

  for (const { id, reblogKey } of likes) {
    unlikeStatusElement.textContent = `Unliking post with ID ${id}...`;
    try {
      await Promise.all([
        apiFetch('/v2/user/unlike', { method: 'POST', body: { id, reblog_key: reblogKey } }),
        sleep(1000)
      ]);
      unlikedCount++;
    } catch (exception) {
      console.error(exception);
      failureCount++;
    }
  }

  showModal({
    title: 'All done!',
    message: [
      `Unliked ${unlikedCount} posts.`,
      document.createElement('br'),
      `Failed to unlike ${failureCount} posts.`,
      document.createElement('br'),
      document.createElement('br'),
      'You may still have some likes due to quirks with the Tumblr API.'
    ],
    buttons: [
      modalCompleteButton
    ]
  });
};

const modalWorkingOptions = {
  title: 'Clearing your likes...',
  message: [
    'Do not navigate away from this page, or the process will be interrupted.',
    document.createElement('br'),
    document.createElement('br'),
    gatherStatusElement,
    document.createElement('br'),
    document.createElement('br'),
    unlikeStatusElement
  ]
};

const modalConfirmButton = Object.assign(document.createElement('button'), {
  textContent: 'Clear my likes',
  className: 'red',
  onclick: () => {
    gatherStatusElement.textContent = '';
    unlikeStatusElement.textContent = '';
    showModal(modalWorkingOptions);
    unlikePosts();
  }
});

const modalPromptOptions = {
  title: 'Clear your likes?',
  message: [
    'This may take a while if you have a lot of likes.'
  ],
  buttons: [
    modalCancelButton,
    modalConfirmButton
  ]
};

const sidebarOptions = {
  id: 'mass-unliker',
  title: 'Mass Unliker',
  rows: [
    {
      label: 'Clear likes',
      onclick: () => showModal(modalPromptOptions),
      carrot: true
    }
  ]
};

export const main = async function () {
  addSidebarItem(sidebarOptions);
};

export const clean = async function () {
  removeSidebarItem(sidebarOptions.id);
};
