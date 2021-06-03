import { addStyle, removeStyle } from '../util/interface.js';
import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { onBaseContainerMutated } from '../util/mutations.js';
import { inject } from '../util/inject.js';

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

    while (fiber.memoizedProps.notification === undefined) {
      fiber = fiber.return;
    }

    if (!fiber || !fiber.memoizedProps.notification) { return; }

    const { targetPostId } = fiber.memoizedProps.notification;
    Object.assign(notificationElement.dataset, { targetPostId });
  });
});

const onButtonClicked = async function ({ currentTarget }) {
  const postElement = currentTarget.closest('[data-id]');
  const { id } = postElement.dataset;

  const { [storageKey]: blockedPostTargetIDs = [] } = await browser.storage.local.get(storageKey);

  if (blockedPostTargetIDs.includes(id)) {
    if (window.confirm('This post\'s notifications are blocked. Unblock this post\'s notifications?')) {
      await browser.storage.local.set({ [storageKey]: blockedPostTargetIDs.filter(blockedId => blockedId !== id) });
    }
  } else {
    if (window.confirm('Block this post\'s notifications?')) {
      blockedPostTargetIDs.push(id);
      await browser.storage.local.set({ [storageKey]: blockedPostTargetIDs });
    }
  }
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
