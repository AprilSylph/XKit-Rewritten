import { getTimelineItemWrapper, filterPostElements } from '../utils/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../utils/meatballs.js';
import { showModal, hideModal, modalCancelButton, modalCompleteButton } from '../utils/modals.js';
import { timelineObject } from '../utils/react_props.js';
import { onNewPosts, pageModifications } from '../utils/mutations.js';
import { dom } from '../utils/dom.js';

const meatballButtonId = 'postblock';
const meatballButtonLabel = 'Block this post';
const hiddenAttribute = 'data-postblock-hidden';
const storageKey = 'postblock.blockedPostRootIDs';

let blockedPostRootIDs = [];

const processPosts = postElements =>
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const postID = postElement.dataset.id;
    const { rebloggedRootId } = await timelineObject(postElement);

    const rootID = rebloggedRootId || postID;

    if (blockedPostRootIDs.includes(rootID)) {
      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
    } else {
      getTimelineItemWrapper(postElement).removeAttribute(hiddenAttribute);
    }
  });

const onButtonClicked = ({ currentTarget }) => {
  const { id, rebloggedRootId } = currentTarget.__timelineObjectData;
  const rootID = rebloggedRootId || id;

  showModal({
    title: 'Block this post?',
    message: [
      'All instances of this post (including reblogs) will be hidden.'
    ],
    buttons: [
      modalCancelButton,
      dom('button', { class: 'red' }, { click: () => blockPost(rootID) }, ['Block this post'])
    ]
  });
};

const blockPost = async rootID => {
  hideModal();
  const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);
  blockedPostRootIDs.push(rootID);
  browser.storage.local.set({ [storageKey]: blockedPostRootIDs });
};

export const onStorageChanged = async function (changes, areaName) {
  if (Object.keys(changes).includes(storageKey)) {
    ({ newValue: blockedPostRootIDs = [] } = changes[storageKey]);
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
            } from New XKit to XKit Rewritten?`
          ],
          buttons: [
            modalCancelButton,
            dom('button', { class: 'blue' }, { click: resolve }, ['Confirm'])
          ]
        });
      });

      blockedPostRootIDs.push(...toAdd);
      await browser.storage.local.set({ [storageKey]: blockedPostRootIDs });

      showModal({
        title: 'Success',
        message: `Imported ${toAdd.length > 1 ? `${toAdd.length} blocked posts` : 'a blocked post'}!`,
        buttons: [modalCompleteButton]
      });
    } else {
      showModal({
        title: 'No new blocked posts!',
        message: 'Your XKit Rewritten configuration has these posts blocked already.',
        buttons: [modalCompleteButton]
      });
    }
  }
};

export const main = async function () {
  ({ [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey));

  registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });

  onNewPosts.addListener(processPosts);

  window.addEventListener('xkit-postblock-migration', migrateBlockedPosts);
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};

export const stylesheet = true;
