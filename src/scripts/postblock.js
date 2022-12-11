import { filterPostElements } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { timelineObject } from '../util/react_props.js';
import { onNewPosts, pageModifications } from '../util/mutations.js';
import { dom } from '../util/dom.js';

const meatballButtonId = 'postblock';
const meatballButtonLabel = 'Block this post';
const hiddenClass = 'xkit-postblock-hidden';
const storageKey = 'postblock.blockedPostRootIDs';
let blockedPostRootIDs;

console.log("pee");

const processPosts = (postElements) =>
  filterPostElements(postElements, { includeFiltered: true }).forEach(
    async (postElement) => {
      const postID = postElement.dataset.id;
      timelineObject(postElement).then(({ rebloggedRootId }) => {
        const rootID = rebloggedRootId || postID;

        if (blockedPostRootIDs.includes(rootID)) {
          postElement.classList.add(hiddenClass);
        } else {
          postElement.classList.remove(hiddenClass);
        }
      });
    }
  );

const onButtonClicked = async function ({ currentTarget }) {
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

export const onStorageChanged = async (changes) => {
  const { [storageKey]: blockedPostRootIDsChanges } = changes;

  if (blockedPostRootIDsChanges) {
    ({ newValue: blockedPostRootIDs } = blockedPostRootIDsChanges);
    pageModifications.trigger(processPosts);
  }
};

export const main = async () => {
  ({ [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(
    storageKey
  ));

  registerMeatballItem({
    id: meatballButtonId,
    label: meatballButtonLabel,
    onclick: onButtonClicked
  });

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);

  $(`.${hiddenClass}`).removeClass(hiddenClass);
};

export const stylesheet = true;
