import { buildStyle } from '../utils/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../utils/meatballs.js';
import { onNewNotifications } from '../utils/mutations.js';
import { showModal, hideModal, modalCancelButton, modalCompleteButton } from '../utils/modals.js';
import { dom } from '../utils/dom.js';
import { userBlogNames, userBlogs } from '../utils/user.js';
import { apiFetch, navigate } from '../utils/tumblr_helpers.js';
import { notificationObject } from '../utils/react_props.js';

const storageKey = 'notificationblock.blockedPostTargetIDs';
const uuidsStorageKey = 'notificationblock.uuids';
const toOpenStorageKey = 'notificationblock.toOpen';
const meatballButtonBlockId = 'notificationblock-block';
const meatballButtonBlockLabel = 'Block notifications';
const meatballButtonUnblockId = 'notificationblock-unblock';
const meatballButtonUnblockLabel = 'Unblock notifications';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let blockedPostTargetIDs;
let uuids = {};

const userBlogsToSearch = userBlogs
  .filter(({ posts }) => posts)
  .sort((a, b) => b.posts - a.posts);

const findUuid = async id => {
  if (uuids[id]) return;
  uuids[id] = false;
  for (const { uuid } of userBlogsToSearch) {
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
const buildCss = () => `:is(${blockedPostTargetIDs.map(rootId => `[data-target-root-post-id="${rootId}"]`).join(', ')
  }) { display: none !important; }`;

const processNotifications = (notificationElements) => {
  notificationElements.forEach(async notificationElement => {
    const notification = await notificationObject(notificationElement);
    if (notification !== undefined) {
      const { targetRootPostId, targetPostId } = notification;
      notificationElement.dataset.targetRootPostId = targetRootPostId || targetPostId;
    }
  });
};

const muteNotificationsMessage = [
  '\n\n',
  'Unlike Tumblr\'s option to "Mute notifications", this will not prevent notifications for this post from being created, so they will still increment your unread notification count.',
  '\n\n',
  'You can use "Mute Notifications" in addition to or instead of this feature. ',
  'It will completely prevent the post from generating notifications while it is enabled, and can be applied temporarily or permanently.'
];

const onButtonClicked = async function ({ currentTarget }) {
  const { id, rebloggedRootId, blog: { uuid }, rebloggedRootUuid } = currentTarget.__timelineObjectData;
  const { response: { muted } } = await apiFetch(`/v2/blog/${uuid}/posts/${id}`);

  const rootId = rebloggedRootId || id;
  const rootUuid = rebloggedRootUuid || uuid;
  const shouldBlockNotifications = blockedPostTargetIDs.includes(rootId) === false;

  const title = shouldBlockNotifications
    ? 'Block this post\'s notifications?'
    : 'Unblock this post\'s notifications?';
  const message = shouldBlockNotifications
    ? [
        'Notifications for this post will be hidden from your activity feed.',
        ...(muted ? [] : muteNotificationsMessage)
      ]
    : ['Notifications for this post will appear in your activity feed again.'];

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
        uuids[rootId] = rootUuid;
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
  onNewNotifications.addListener(processNotifications);

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
  onNewNotifications.removeListener(processNotifications);
  unregisterMeatballItem(meatballButtonBlockId);
  unregisterMeatballItem(meatballButtonUnblockId);
};
