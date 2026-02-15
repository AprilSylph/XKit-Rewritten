import { dom } from '../../utils/dom.js';
import { showModal, modalCancelButton, modalCompleteButton, showErrorModal } from '../../utils/modals.js';
import { addSidebarItem, removeSidebarItem } from '../../utils/sidebar.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const gatherStatusElement = dom('span');
const unlikeStatusElement = dom('span');

const gatherLikes = async function () {
  const likes = [];
  let resource = '/v2/user/likes';

  while (resource) {
    const { response } = await apiFetch(resource);
    const posts = response.likedPosts.filter(({ reblogKey }) => reblogKey);
    likes.push(...posts);
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
        sleep(1000),
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
      `Unliked ${unlikedCount} posts.\n`,
      `Failed to unlike ${failureCount} posts.\n\n`,
      dom('small', null, null, ['You may still have some likes due to quirks with the Tumblr API.']),
    ],
    buttons: [
      modalCompleteButton,
    ],
  });
};

const modalWorkingOptions = {
  title: 'Clearing your likes...',
  message: [
    dom('small', null, null, ['Do not navigate away from this page, or the process will be interrupted.\n\n']),
    gatherStatusElement,
    '\n',
    unlikeStatusElement,
  ],
};

const modalConfirmButton = dom(
  'button',
  { class: 'red' },
  {
    click () {
      gatherStatusElement.textContent = '';
      unlikeStatusElement.textContent = '';
      showModal(modalWorkingOptions);
      unlikePosts().catch(showErrorModal);
    },
  },
  ['Clear my likes'],
);

const modalPromptOptions = {
  title: 'Clear your likes?',
  message: [
    'This may take a while if you have a lot of likes.',
  ],
  buttons: [
    modalCancelButton,
    modalConfirmButton,
  ],
};

const sidebarOptions = {
  id: 'mass-unliker',
  title: 'Mass Unliker',
  rows: [
    {
      label: 'Clear likes',
      onclick: () => showModal(modalPromptOptions),
      carrot: true,
    },
  ],
  visibility: () => /^\/likes/.test(location.pathname),
};

export const main = async function () {
  addSidebarItem(sidebarOptions);
};

export const clean = async function () {
  removeSidebarItem(sidebarOptions.id);
};
