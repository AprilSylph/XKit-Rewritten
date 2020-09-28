const backupSection = document.getElementById('backup');
const backupSectionLink = document.querySelector('a[href="#backup"]');
const storageAreasDiv = backupSection.querySelector('.storage-areas');

let syncSupported = false;

const uploadData = async function () {
  const errorsDisplay = document.querySelector('.if-sync-supported .errors');
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

  await browser.storage.sync.set(storageLocal);
  backupSectionLink.click();
};

const downloadData = async function () {
  const errorsDisplay = document.querySelector('.if-sync-supported .errors');
  errorsDisplay.textContent = '';

  const storageSync = await browser.storage.sync.get();
  await browser.storage.local.set(storageSync);
  backupSectionLink.click();

  document.querySelector('a[href="#configuration"]').classList.add('outdated');
};

const downloadToFile = async function () {
  const storageLocal = await browser.storage.local.get();
  const stringifiedStorage = JSON.stringify(storageLocal);
  const storageBlob = new Blob([stringifiedStorage], { type: 'application/json' });
  const blobUrl = URL.createObjectURL(storageBlob);

  const tempLink = document.createElement('a');
  tempLink.href = blobUrl;
  tempLink.download = 'XKit Export.json';

  document.documentElement.appendChild(tempLink);
  tempLink.click();
  tempLink.parentNode.removeChild(tempLink);
  URL.revokeObjectURL(blobUrl);
};

const renderBackup = async function () {
  for (const storageArea of ['local', 'sync']) {
    const div = document.createElement('div');
    storageAreasDiv.appendChild(div);

    const heading = document.createElement('h4');
    heading.textContent = `${storageArea} storage`;
    div.appendChild(heading);

    const p = document.createElement('p');
    p.textContent = 'Last modified: ';
    div.appendChild(p);

    try {
      const { storageLastModified } = await browser.storage[storageArea].get('storageLastModified');

      if (storageArea === 'sync') {
        syncSupported = true;
      }

      if (storageLastModified) {
        const date = new Date(storageLastModified);
        const dateString = date.toLocaleString();
        p.textContent += dateString;
      } else {
        p.textContent += 'never';
      }
    } catch (exception) {
      p.textContent = 'Not supported by this browser';
    }
  }

  if (syncSupported) {
    const ifSyncSupportedDiv = backupSection.querySelector('.if-sync-supported');
    ifSyncSupportedDiv.classList.add('sync-supported');

    const uploadButton = ifSyncSupportedDiv.querySelector('#upload');
    const downloadButton = ifSyncSupportedDiv.querySelector('#download');

    uploadButton.addEventListener('click', uploadData);
    downloadButton.addEventListener('click', downloadData);
  }

  const localDownloadButton = document.getElementById('download-to-file');
  localDownloadButton.addEventListener('click', downloadToFile);
};

renderBackup();

backupSectionLink.addEventListener('click', () => {
  storageAreasDiv.textContent = '';
  renderBackup();
});
