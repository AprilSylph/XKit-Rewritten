import { buildStyle } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { pageModifications } from '../util/mutations.js';
import { inject } from '../util/inject.js';
import { keyToCss } from '../util/css_map.js';
import { showModal, hideModal, modalCancelButton, modalCompleteButton } from '../util/modals.js';
import { dom } from '../util/dom.js';
import { userBlogNames, userBlogs } from '../util/user.js';
import { apiFetch, navigate } from '../util/tumblr_helpers.js';

const storageKey = 'notificationblock.blockedPostTargetIDs';
const uuidsStorageKey = 'notificationblock.uuids';
const toOpenStorageKey = 'notificationblock.toOpen';
const meatballButtonBlockId = 'notificationblock-block';
const meatballButtonBlockLabel = 'Block notifications';
const meatballButtonUnblockId = 'notificationblock-unblock';
const meatballButtonUnblockLabel = 'Unblock notifications';
const notificationSelector = keyToCss('notification');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let blockedPostTargetIDs;
let uuids = {};

const findUuid = async id => {
  if (uuids[id]) return;
  uuids[id] = false;
  for (const { uuid } of userBlogs.sort((a, b) => b.posts - a.posts)) {
    const delay = sleep(500);
    try {
      await apiFetch(`/v2/blog/${uuid}/posts/${id}`);
      uuids[id] = uuid;
      break;
    } catch (e) {
      await delay;
    }
  }
  await browser.storage.local.set({ [uuidsStorageKey]: uuids });
};

const backgroundFindUuids = async () => {
  const idsMissingUuids = blockedPostTargetIDs.filter(id => uuids[id] === undefined).reverse();
  for (const id of idsMissingUuids) {
    await findUuid(id);
  }
};

const styleElement = buildStyle();
const buildCss = () => `:is(${
  blockedPostTargetIDs.map(rootId => `[data-target-root-post-id="${rootId}"]`).join(', ')
}) { display: none !important; }`;

const unburyTargetPostIds = async (notificationSelector) => {
  [...document.querySelectorAll(notificationSelector)]
    .forEach(notificationElement => {
      const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
      let fiber = notificationElement[reactKey];

      while (fiber !== null) {
        const { notification } = fiber.memoizedProps || {};
        if (notification !== undefined) {
          const { targetRootPostId, targetPostId } = notification;
          notificationElement.dataset.targetRootPostId = targetRootPostId || targetPostId;
          break;
        } else {
          fiber = fiber.return;
        }
      }
    });
};

const processNotifications = () => inject(unburyTargetPostIds, [notificationSelector]);

const onButtonClicked = async function ({ currentTarget }) {
  const { id, rebloggedRootId, blog: { uuid } } = currentTarget.__timelineObjectData;
  const rootId = rebloggedRootId || id;
  const shouldBlockNotifications = blockedPostTargetIDs.includes(rootId) === false;

  const title = shouldBlockNotifications
    ? 'Block this post\'s notifications?'
    : 'Unblock this post\'s notifications?';
  const message = [
    shouldBlockNotifications
      ? 'Notifications for this post will be hidden from your activity feed.'
      : 'Notifications for this post will appear in your activity feed again.'
  ];
  const textContent = shouldBlockNotifications
    ? 'Block notifications'
    : 'Unblock notifications';
  const className = shouldBlockNotifications
    ? 'red'
    : 'blue';
  const saveNotificationPreference = shouldBlockNotifications
    ? () => {
        blockedPostTargetIDs.push(rootId);
        browser.storage.local.set({ [storageKey]: blockedPostTargetIDs });
        uuids[rootId] = uuid;
        browser.storage.local.set({ [uuidsStorageKey]: uuids });
      }
    : () => {
        blockedPostTargetIDs = blockedPostTargetIDs.filter(blockedId => blockedId !== rootId);
        browser.storage.local.set({ [storageKey]: blockedPostTargetIDs });
        delete uuids[rootId];
        browser.storage.local.set({ [uuidsStorageKey]: uuids });
      };

  showModal({
    title,
    message,
    buttons: [
      modalCancelButton,
      dom('button', { class: className }, {
        click () {
          hideModal();
          saveNotificationPreference();
        }
      }, [textContent])
    ]
  });
};

const blockPostFilter = async ({ blogName, rebloggedRootName, rebloggedFromName, id, rebloggedRootId }) => {
  const rootId = rebloggedRootId || id;
  const canReceiveActivity = userBlogNames.includes(blogName) ||
    userBlogNames.includes(rebloggedFromName) ||
    userBlogNames.includes(rebloggedRootName);

  return canReceiveActivity && blockedPostTargetIDs.includes(rootId) === false;
};

const unblockPostFilter = async ({ id, rebloggedRootId }) => {
  const rootId = rebloggedRootId || id;
  return blockedPostTargetIDs.includes(rootId);
};

export const onStorageChanged = (changes, areaName) => {
  const { [storageKey]: blockedPostChanges, [uuidsStorageKey]: uuidsChanges } = changes;

  if (uuidsChanges) {
    ({ newValue: uuids } = uuidsChanges);
  }

  if (blockedPostChanges) {
    blockedPostTargetIDs = changes[storageKey].newValue;
    styleElement.textContent = buildCss();
  }
};

export const main = async function () {
  ({ [storageKey]: blockedPostTargetIDs = [] } = await browser.storage.local.get(storageKey));
  ({ [uuidsStorageKey]: uuids = {} } = await browser.storage.local.get(uuidsStorageKey));

  backgroundFindUuids();

  styleElement.textContent = buildCss();
  document.documentElement.append(styleElement);

  pageModifications.register(notificationSelector, processNotifications);

  registerMeatballItem({ id: meatballButtonBlockId, label: meatballButtonBlockLabel, onclick: onButtonClicked, postFilter: blockPostFilter });
  registerMeatballItem({ id: meatballButtonUnblockId, label: meatballButtonUnblockLabel, onclick: onButtonClicked, postFilter: unblockPostFilter });

  const { [toOpenStorageKey]: toOpen } = await browser.storage.local.get(toOpenStorageKey);
  if (toOpen) {
    browser.storage.local.remove(toOpenStorageKey);

    const { blockedPostID } = toOpen;
    try {
      showModal({
        title: 'NotificationBlock',
        message: [`Searching for post ${blockedPostID} on your blogs. Please wait...`]
      });
      await findUuid(blockedPostID);
      if (!uuids[blockedPostID]) {
        throw new Error();
      }
      const { response: { blog: { name } } } = await apiFetch(`/v2/blog/${uuids[blockedPostID]}/info`);
      hideModal();
      navigate(`/${name}/${blockedPostID}`);
    } catch (e) {
      showModal({
        title: 'NotificationBlock',
        message: [`Failed to find and open post ${blockedPostID}! It may not be one of your original posts.`],
        buttons: [modalCompleteButton]
      });
    }
  }
};

export const clean = async function () {
  styleElement.remove();
  pageModifications.unregister(processNotifications);
  unregisterMeatballItem(meatballButtonBlockId);
  unregisterMeatballItem(meatballButtonUnblockId);
};
