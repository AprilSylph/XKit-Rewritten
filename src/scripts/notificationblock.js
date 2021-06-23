import { addStyle, removeStyle } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { onBaseContainerMutated } from '../util/mutations.js';
import { inject } from '../util/inject.js';
import { showModal, hideModal, modalCancelButton } from '../util/modals.js';

const storageKey = 'notificationblock.blockedPostTargetIDs';
const meatballButtonLabel = 'NotificationBlock';

let css;

const buildStyles = blockedPostTargetIDs => blockedPostTargetIDs.map(id => `[data-target-post-id="${id}"]`).join(', ').concat(' { display: none; }');

const processNotifications = () => inject(async () => {
  const cssMap = await window.tumblr.getCssMap();
  const notificationSelector = cssMap.notification.map(className => `.${className}:not([data-target-post-id])`).join(', ');

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
});

const onButtonClicked = async function ({ currentTarget }) {
  const postElement = currentTarget.closest('[data-id]');
  const { id } = postElement.dataset;

  const { [storageKey]: blockedPostTargetIDs = [] } = await browser.storage.local.get(storageKey);
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

const postFilter = postElement => postElement.querySelector('footer a[href*="/edit"]') !== null;

export const onStorageChanged = (changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    removeStyle(css);
    css = buildStyles(changes[storageKey].newValue);
    addStyle(css);
  }
};

export const main = async function () {
  const { [storageKey]: blockedPostTargetIDs = [] } = await browser.storage.local.get(storageKey);
  css = buildStyles(blockedPostTargetIDs);
  addStyle(css);

  onBaseContainerMutated.addListener(processNotifications);
  processNotifications();

  registerMeatballItem({ label: meatballButtonLabel, onClick: onButtonClicked, postFilter });
};

export const clean = async function () {
  removeStyle(css);
  onBaseContainerMutated.removeListener(processNotifications);
  unregisterMeatballItem(meatballButtonLabel);
};
