import { buildStyle } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { onBaseContainerMutated } from '../util/mutations.js';
import { inject } from '../util/inject.js';
import { keyToClasses } from '../util/css_map.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';

const storageKey = 'notificationblock.blockedPostTargetIDs';
const meatballButtonBlockId = 'notificationblock-block';
const meatballButtonBlockLabel = 'Block notifications';
const meatballButtonUnblockId = 'notificationblock-unblock';
const meatballButtonUnblockLabel = 'Unblock notifications';

let blockedPostTargetIDs;

const styleElement = buildStyle();
const buildCss = () => blockedPostTargetIDs.length === 0
  ? ''
  : blockedPostTargetIDs.map(id => `[data-target-post-id="${id}"]`).join(', ').concat(' { display: none; }');

const unburyTargetPostIds = async (notificationSelector) => {
  [...document.querySelectorAll(notificationSelector)].forEach(async notificationElement => {
    const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactInternalInstance'));
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

const processNotifications = async () => {
  const notificationClasses = await keyToClasses('notification');
  const notificationSelector = notificationClasses
    .map((className) => `.${className}:not([data-target-post-id])`)
    .join(', ');

  if (document.querySelectorAll(notificationSelector).length) {
    inject(unburyTargetPostIds, [notificationSelector]);
  }
};

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

  onBaseContainerMutated.addListener(processNotifications);
  processNotifications();

  registerMeatballItem({ id: meatballButtonBlockId, label: meatballButtonBlockLabel, onclick: onButtonClicked, postFilter: blockPostFilter });
  registerMeatballItem({ id: meatballButtonUnblockId, label: meatballButtonUnblockLabel, onclick: onButtonClicked, postFilter: unblockPostFilter });
};

export const clean = async function () {
  styleElement.remove();
  onBaseContainerMutated.removeListener(processNotifications);
  unregisterMeatballItem(meatballButtonBlockId);
  unregisterMeatballItem(meatballButtonUnblockId);
};
