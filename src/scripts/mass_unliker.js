import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { apiFetch } from '../util/tumblr_helpers.js';
import { notify } from '../util/notifications.js';

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

  hideModal();
  unlikedCount && notify(`Unliked ${unlikedCount} posts.`);
  failureCount && notify(`Failed to unlike ${failureCount} posts.`);
};

const modalWorkingOptions = {
  title: 'Clearing your likes...',
  message: [
    'Do not navigate away from this page, or the process will be interrupted.',
    document.createElement('br'),
    'This dialog will disappear when the process is complete.',
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
    'This may take a while if you have a lot of likes.',
    document.createElement('br'),
    document.createElement('br'),
    'You may be left with some likes due to imperfections in the Tumblr API.'

  ],
  buttons: [
    modalCancelButton,
    modalConfirmButton
  ]
};

const sidebarOptions = {
  id: 'mass-unliker',
  title: 'Mass Unliker',
  items: [
    {
      label: 'Clear likes',
      onClick: () => showModal(modalPromptOptions),
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
