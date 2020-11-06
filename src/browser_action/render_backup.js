const localImportTextarea = document.getElementById('local-import');
const restoreButton = document.getElementById('local-restore');

const cloudUpload = async function () {
  const errorsDisplay = document.querySelector('#cloud .errors');
  errorsDisplay.textContent = '';

  const storageLocal = await browser.storage.local.get();
  const keys = Object.keys(storageLocal);

  if (keys.length > 512) {
    errorsDisplay.textContent += 'ERROR: More than 512 storage keys; cannot upload.';
    return;
  }

  const encoder = new TextEncoder();

  for (const key of keys) {
    const stringToMeasure = key + JSON.stringify(storageLocal[key]);
    const byteStream = encoder.encode(stringToMeasure);
    if (byteStream.length > 8192) {
      errorsDisplay.textContent += `WARNING: Dropped ${key} for exceeding quota.\n  (${byteStream.length} of 8192 bytes used)\n`;
      delete storageLocal[key];
    }
  }

  const stringifiedStorage = JSON.stringify(storageLocal);
  const storageByteStream = encoder.encode(stringifiedStorage);
  if (storageByteStream.length > 102400) {
    errorsDisplay.textContent += `ERROR: Storage too large to upload.\n  (${storageByteStream.length} of 102400 bytes used)\n`;
    return;
  }

  browser.storage.sync.set(storageLocal);
};

const cloudDownload = async function () {
  const errorsDisplay = document.querySelector('#cloud .errors');
  errorsDisplay.textContent = '';

  const storageSync = await browser.storage.sync.get();
  await browser.storage.local.set(storageSync);

  document.querySelector('a[href="#configuration"]').classList.add('outdated');
};

const localExport = async function () {
  const storageLocal = await browser.storage.local.get();
  const stringifiedStorage = JSON.stringify(storageLocal, null, 2);
  const storageBlob = new Blob([stringifiedStorage], { type: 'application/json' });
  const blobUrl = URL.createObjectURL(storageBlob);

  const tempLink = document.createElement('a');
  tempLink.href = blobUrl;
  tempLink.download = `XKit Payload ${storageLocal.storageLastModified}.json`;

  document.documentElement.appendChild(tempLink);
  tempLink.click();
  tempLink.parentNode.removeChild(tempLink);
  URL.revokeObjectURL(blobUrl);
};

const localImport = async function () {
  const importText = localImportTextarea.value;

  if (importText === localImportTextarea.textContent) {
    localImportTextarea.value = '';
    updateRestoreButtonClass();
    return;
  }

  try {
    const parsedStorage = JSON.parse(importText);
    await browser.storage.local.set(parsedStorage);

    document.querySelector('a[href="#configuration"]').classList.add('outdated');
  } catch (exception) {
    console.error(exception);
  }
};

const updateLastModifiedMessage = async function (areaName) {
  const messageElement = document.getElementById(`${areaName}-storage-message`);

  try {
    const { storageLastModified } = await browser.storage[areaName].get('storageLastModified');

    if (areaName === 'sync') {
      const cloudControls = document.querySelector('.cloud-controls');
      cloudControls.style.display = null;
    }

    messageElement.textContent = 'Last modified: ';

    if (storageLastModified) {
      const date = new Date(storageLastModified);
      const dateString = date.toLocaleString();
      messageElement.textContent += dateString;
    } else {
      messageElement.textContent += 'never';
    }
  } catch (exception) {
    messageElement.textContent = 'Not supported by this browser';
  }
};

const updateLocalStorageTextarea = async function () {
  const storageLocal = await browser.storage.local.get();
  const stringifiedStorage = JSON.stringify(storageLocal, null, 2);

  localImportTextarea.textContent = stringifiedStorage;
  localImportTextarea.value = stringifiedStorage;

  updateRestoreButtonClass();
};

const updateRestoreButtonClass = async function () {
  const addOrRemove = localImportTextarea.value === localImportTextarea.textContent ? 'add' : 'remove';
  restoreButton.classList[addOrRemove]('unchanged-import');
};

const renderCloudBackup = async function () {
  ['local', 'sync'].forEach(updateLastModifiedMessage);

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (Object.keys(changes).includes('storageLastModified')) {
      updateLastModifiedMessage(areaName);
    }
  });

  const uploadButton = document.getElementById('cloud-upload');
  const downloadButton = document.getElementById('cloud-download');

  uploadButton.addEventListener('click', cloudUpload);
  downloadButton.addEventListener('click', cloudDownload);
};

const renderLocalBackup = async function () {
  updateLocalStorageTextarea();

  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      updateLocalStorageTextarea();
    }
  });

  const downloadButton = document.getElementById('local-download');

  downloadButton.addEventListener('click', localExport);
  restoreButton.addEventListener('click', localImport);
};

renderCloudBackup();
renderLocalBackup();

localImportTextarea.addEventListener('input', updateRestoreButtonClass);
