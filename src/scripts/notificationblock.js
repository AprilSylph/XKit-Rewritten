import { buildStyle } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { pageModifications } from '../util/mutations.js';
import { injectVoid } from '../util/inject.js';
import { keyToCss } from '../util/css_map.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';

const storageKey = 'notificationblock.blockedPostTargetIDs';
const meatballButtonBlockId = 'notificationblock-block';
const meatballButtonBlockLabel = 'Block notifications';
const meatballButtonUnblockId = 'notificationblock-unblock';
const meatballButtonUnblockLabel = 'Unblock notifications';

let blockedPostTargetIDs;
let notificationSelector;

const styleElement = buildStyle();
const buildCss = () => blockedPostTargetIDs.length === 0
  ? ''
  : blockedPostTargetIDs.map(id => `[data-target-post-id="${id}"]`).join(', ').concat(' { display: none; }');

const unburyTargetPostIds = (notificationSelector) => {
  [...document.querySelectorAll(notificationSelector)]
    .filter(({ dataset: { targetPostId } }) => targetPostId === undefined)
    .forEach(async notificationElement => {
      const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
      let fiber = notificationElement[reactKey];

      while (fiber !== null) {
        const { notification } = fiber.memoizedProps || {};
        if (notification !== undefined) {
          const { targetPostId } = notification;
          Object.assign(notificationElement.dataset, { targetPostId });
          break;
        } else {
          fiber = fiber.return;
        }
      }
    });
};

const processNotifications = () => injectVoid(unburyTargetPostIds, [notificationSelector]);

const onButtonClicked = async function ({ currentTarget }) {
  const postElement = currentTarget.closest('[data-id]');
  const { id } = postElement.dataset;

  const shouldBlockNotifications = blockedPostTargetIDs.includes(id) === false;

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
    ? () => { blockedPostTargetIDs.push(id); browser.storage.local.set({ [storageKey]: blockedPostTargetIDs }); }
    : () => browser.storage.local.set({ [storageKey]: blockedPostTargetIDs.filter(blockedId => blockedId !== id) });

  showModal({
    title,
    message,
    buttons: [
      modalCancelButton,
      Object.assign(document.createElement('button'), {
        textContent,
        className,
        onclick: () => { hideModal(); saveNotificationPreference(); }
      })
    ]
  });
};

const blockPostFilter = postElement => postElement.querySelector('footer a[href*="/edit"]') !== null && blockedPostTargetIDs.includes(postElement.dataset.id) === false;
const unblockPostFilter = ({ dataset: { id } }) => blockedPostTargetIDs.includes(id);

export const onStorageChanged = (changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    blockedPostTargetIDs = changes[storageKey].newValue;
    styleElement.textContent = buildCss();
  }
};

export const main = async function () {
  ({ [storageKey]: blockedPostTargetIDs = [] } = await browser.storage.local.get(storageKey));
  styleElement.textContent = buildCss();
  document.head.append(styleElement);

  notificationSelector = await keyToCss('notification');
  pageModifications.register(notificationSelector, processNotifications);

  registerMeatballItem({ id: meatballButtonBlockId, label: meatballButtonBlockLabel, onclick: onButtonClicked, postFilter: blockPostFilter });
  registerMeatballItem({ id: meatballButtonUnblockId, label: meatballButtonUnblockLabel, onclick: onButtonClicked, postFilter: unblockPostFilter });
};

export const clean = async function () {
  styleElement.remove();
  pageModifications.unregister(processNotifications);
  unregisterMeatballItem(meatballButtonBlockId);
  unregisterMeatballItem(meatballButtonUnblockId);
};
