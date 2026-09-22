import { dom } from '../../utils/dom.js';
import { createPostHideFunctions } from '../../utils/hide_posts.js';
import { filterPostElements } from '../../utils/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../../utils/meatballs.js';
import { hideModal, modalCancelButton, modalCompleteButton, showModal } from '../../utils/modals.js';
import { onNewPosts, pageModifications } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';
import { navigate } from '../../utils/tumblr_helpers.js';

const meatballButtonBlockId = 'postblock-block';
const meatballButtonBlockLabel = 'Block this post';
const meatballButtonUnblockId = 'postblock-unblock';
const meatballButtonUnblockLabel = 'Unblock this post';

const storageKey = 'postblock.blockedPostRootIDs';
const blogUuidsStorageKey = 'postblock.blockedPostBlogUUIDs';

let blogUuids = {};

let blockedPostRootIDs = [];

const { hidePost, showPost, showPosts } = createPostHideFunctions({
  id: 'postblock',
  permalinkPageControls: {
    message: 'This post is hidden by PostBlock.',
  },
});

const saveUuidPair = (postId, blogUuid) => {
  if (blockedPostRootIDs.includes(postId) && !blogUuids[postId]) {
    blogUuids[postId] = blogUuid;
    browser.storage.local.set({ [blogUuidsStorageKey]: blogUuids });
  }
};

const processPosts = postElements =>
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const postID = postElement.dataset.id;
    const {
      rebloggedRootId,
      rebloggedRootUuid,
      id,
      blog: { uuid },
      rebloggedFromId,
      rebloggedFromUuid,
    } = await timelineObject(postElement);

    const rootID = rebloggedRootId || postID;

    if (blockedPostRootIDs.includes(rootID)) {
      hidePost(postElement);
    } else {
      showPost(postElement);
    }

    saveUuidPair(id, uuid);
    saveUuidPair(rebloggedFromId, rebloggedFromUuid);
    saveUuidPair(rebloggedRootId, rebloggedRootUuid);
  });

const onButtonClicked = ({ currentTarget }) => {
  const { id, rebloggedRootId } = currentTarget.__timelineObjectData;
  const rootID = rebloggedRootId || id;
  const shouldBlockPost = blockedPostRootIDs.includes(rootID) === false;

  const title = shouldBlockPost
    ? 'Block this post?'
    : 'Unblock this post?';
  const message = shouldBlockPost
    ? 'All instances of this post (including reblogs) will be hidden.'
    : 'All instances of this post (including reblogs) will become visible again.';
  const textContent = shouldBlockPost
    ? 'Block this post'
    : 'Unblock this post';
  const className = shouldBlockPost
    ? 'red'
    : 'blue';
  const saveNotificationPreference = shouldBlockPost
    ? () => { blockedPostRootIDs.push(rootID); browser.storage.local.set({ [storageKey]: blockedPostRootIDs }); }
    : () => browser.storage.local.set({ [storageKey]: blockedPostRootIDs.filter(blockedId => blockedId !== rootID) });

  showModal({
    title,
    message,
    buttons: [
      modalCancelButton,
      dom('button', { class: className }, {
        click () {
          hideModal();
          saveNotificationPreference();
        },
      }, [textContent]),
    ],
  });
};

export const onStorageChanged = async function (changes) {
  const { [storageKey]: blockedPostChanges, [blogUuidsStorageKey]: blogUuidsChanges } = changes;

  if (blogUuidsChanges) {
    ({ newValue: blogUuids } = blogUuidsChanges);
  }

  if (blockedPostChanges) {
    ({ newValue: blockedPostRootIDs = [] } = blockedPostChanges);
    pageModifications.trigger(processPosts);
  }
};

const migrateBlockedPosts = async ({ detail }) => {
  const newBlockedPostRootIDs = JSON.parse(detail);

  if (Array.isArray(newBlockedPostRootIDs)) {
    window.dispatchEvent(new CustomEvent('xkit-postblock-migration-success'));

    const toAdd = newBlockedPostRootIDs
      .map(id => String(id))
      .filter(id => !blockedPostRootIDs.includes(id));

    if (toAdd.length) {
      await new Promise(resolve => {
        showModal({
          title: 'Add blocked posts?',
          message: [
            `Would you like to import ${toAdd.length} blocked post id${
              toAdd.length === 1 ? '' : 's'
            } from New XKit to XKit Rewritten?`,
          ],
          buttons: [
            modalCancelButton,
            dom('button', { class: 'blue' }, { click: resolve }, ['Confirm']),
          ],
        });
      });

      blockedPostRootIDs.push(...toAdd);
      await browser.storage.local.set({ [storageKey]: blockedPostRootIDs });

      showModal({
        title: 'Success',
        message: `Imported ${toAdd.length > 1 ? `${toAdd.length} blocked posts` : 'a blocked post'}!`,
        buttons: [modalCompleteButton],
      });
    } else {
      showModal({
        title: 'No new blocked posts!',
        message: 'Your XKit Rewritten configuration has these posts blocked already.',
        buttons: [modalCompleteButton],
      });
    }
  }
};

const blockPostFilter = ({ id, rebloggedRootId }) => blockedPostRootIDs.includes(rebloggedRootId || id) === false;
const unblockPostFilter = ({ id, rebloggedRootId }) => blockedPostRootIDs.includes(rebloggedRootId || id);

export const main = async function () {
  ({ [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey));
  ({ [blogUuidsStorageKey]: blogUuids = {} } = await browser.storage.local.get(blogUuidsStorageKey));

  registerMeatballItem({ id: meatballButtonBlockId, label: meatballButtonBlockLabel, onclick: onButtonClicked, postFilter: blockPostFilter });
  registerMeatballItem({ id: meatballButtonUnblockId, label: meatballButtonUnblockLabel, onclick: onButtonClicked, postFilter: unblockPostFilter });

  onNewPosts.addListener(processPosts);

  window.addEventListener('xkit-postblock-migration', migrateBlockedPosts);

  const blockedPostID = location.hash.match(/(?<=^#postblock:)\d{1,20}$/)?.[0];

  if (blockedPostID) {
    navigate(`./${blockedPostID}`);
  }
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonBlockId);
  unregisterMeatballItem(meatballButtonUnblockId);
  onNewPosts.removeListener(processPosts);

  showPosts();
};
