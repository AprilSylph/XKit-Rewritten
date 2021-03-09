const onMessageCommands = {
  'notifications:create': ({ id, options = {} }) => browser.notifications.create(id, options),
  'notifications:clear': ({ id }) => browser.notifications.clear(id)
};

const onMessageCommandList = Object.keys(onMessageCommands);

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (onMessageCommandList.includes(message.command)) {
    onMessageCommands[message.command](message.arguments);
  }
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || Object.keys(changes).includes('storageLastModified')) {
    return;
  }

  const now = new Date();
  const storageLastModified = now.getTime();

  browser.storage.local.set({ storageLastModified });
});
