const self = browser.management.getSelf();

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message === 'browser.management.getSelf') return self;
});
