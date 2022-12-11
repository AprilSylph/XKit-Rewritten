import { filterPostElements } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { timelineObject } from '../util/react_props.js';
import { onNewPosts } from '../util/mutations.js';
import { dom } from '../util/dom.js';
import { buildStyle } from '../util/interface.js';

const meatballButtonId = 'postblock';
const meatballButtonLabel = 'Block this post';
const storageKey = 'postblock.blockedPostRootIDs';
let blockedPostRootIDs;

const styleElement = buildStyle();
const buildCss = () => `:is(${
  blockedPostRootIDs.map(rootId => `[data-target-root-id="${rootId}"]`).join(', ')
}) { display: none !important; }`;

const processPosts = (postElements) =>
  filterPostElements(postElements, { includeFiltered: true }).forEach(
    async (postElement) => {
      const { rebloggedRootId } = await timelineObject(postElement);
      const rootID = rebloggedRootId || postElement.dataset.id;
      postElement.dataset.targetRootId = rootID;
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
    styleElement.textContent = buildCss();
  }
};

export const main = async () => {
  ({ [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(
    storageKey
  ));

  styleElement.textContent = buildCss();
  document.head.append(styleElement);

  registerMeatballItem({
    id: meatballButtonId,
    label: meatballButtonLabel,
    onclick: onButtonClicked
  });

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  styleElement.remove();
  unregisterMeatballItem(meatballButtonId);
  onNewPosts.removeListener(processPosts);
};

export const stylesheet = true;
