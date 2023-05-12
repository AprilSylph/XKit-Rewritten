import { buildStyle } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { pageModifications } from '../util/mutations.js';
import { inject } from '../util/inject.js';
import { keyToCss } from '../util/css_map.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';
import { dom } from '../util/dom.js';
import { userBlogNames } from '../util/user.js';
import { apiFetch, navigate } from '../util/tumblr_helpers.js';
import { notify } from '../util/notifications.js';

const storageKey = 'notificationblock.blockedPostTargetIDs';
const namesStorageKey = 'notificationblock.names';
const toOpenStorageKey = 'notificationblock.toOpen';
const meatballButtonBlockId = 'notificationblock-block';
const meatballButtonBlockLabel = 'Block notifications';
const meatballButtonUnblockId = 'notificationblock-unblock';
const meatballButtonUnblockLabel = 'Unblock notifications';
const notificationSelector = keyToCss('notification');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let blockedPostTargetIDs;
let names = {};

const backgroundPopulateNames = async () => {
  Object.keys(names).forEach(id => {
    if (names[id] && !userBlogNames.includes(names[id])) {
      delete names[id];
    }
  });
  await browser.storage.local.set({ [namesStorageKey]: names });

  const idsMissingNames = blockedPostTargetIDs.filter(id => names[id] === undefined).reverse();

  for (const id of idsMissingNames) {
    names[id] = false;
    for (const name of userBlogNames) {
      try {
        await apiFetch(`/v2/blog/${name}/posts/${id}`);
        names[id] = name;
        break;
      } catch (e) {
        await sleep(1000);
      }
    }
    await browser.storage.local.set({ [namesStorageKey]: names });
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
  const { id, rebloggedRootId } = currentTarget.__timelineObjectData;
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
    ? () => { blockedPostTargetIDs.push(rootId); browser.storage.local.set({ [storageKey]: blockedPostTargetIDs }); }
    : () => browser.storage.local.set({ [storageKey]: blockedPostTargetIDs.filter(blockedId => blockedId !== rootId) });

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
  const { [storageKey]: blockedPostChanges, [namesStorageKey]: namesChanges } = changes;

  if (namesChanges) {
    ({ newValue: names } = namesChanges);
  }

  if (blockedPostChanges) {
    blockedPostTargetIDs = changes[storageKey].newValue;
    styleElement.textContent = buildCss();
  }
};

export const main = async function () {
  ({ [storageKey]: blockedPostTargetIDs = [] } = await browser.storage.local.get(storageKey));
  ({ [namesStorageKey]: names = {} } = await browser.storage.local.get(namesStorageKey));

  backgroundPopulateNames();

  styleElement.textContent = buildCss();
  document.documentElement.append(styleElement);

  pageModifications.register(notificationSelector, processNotifications);

  registerMeatballItem({ id: meatballButtonBlockId, label: meatballButtonBlockLabel, onclick: onButtonClicked, postFilter: blockPostFilter });
  registerMeatballItem({ id: meatballButtonUnblockId, label: meatballButtonUnblockLabel, onclick: onButtonClicked, postFilter: unblockPostFilter });

  const { [toOpenStorageKey]: toOpen } = await browser.storage.local.get(toOpenStorageKey);
  if (toOpen) {
    browser.storage.local.remove(toOpenStorageKey);

    try {
      const { name, blockedPostID } = toOpen;
      navigate(`/${name}/${blockedPostID}`);
    } catch (e) {
      notify('Failed to open post!');
    }
  }
};

export const clean = async function () {
  styleElement.remove();
  pageModifications.unregister(processNotifications);
  unregisterMeatballItem(meatballButtonBlockId);
  unregisterMeatballItem(meatballButtonUnblockId);
};
