browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || Object.keys(changes).includes('storageLastModified')) {
    return;
  }

  const now = new Date();
  const storageLastModified = now.getTime();

  browser.storage.local.set({ storageLastModified });
});
