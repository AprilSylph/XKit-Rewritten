const localExportDisplayElement = document.getElementById('local-storage-export');
const localCopyButton = document.getElementById('copy-local');
const localDownloadButton = document.getElementById('download-local');

const localImportTextarea = document.getElementById('local-storage-import');
const localRestoreButton = document.getElementById('restore-local');

const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), ms));

const updateLocalExportDisplay = async function () {
  const storageLocal = await browser.storage.local.get();
  const stringifiedStorage = JSON.stringify(storageLocal, null, 2);

  localExportDisplayElement.textContent = stringifiedStorage;

  if (Object.keys(storageLocal).length === 0) {
    document.getElementById('export').open = false;
    document.getElementById('import').open = true;
  }
};

const localCopy = async function () {
  if (localCopyButton.classList.contains('copied')) { return; }

  navigator.clipboard.writeText(localExportDisplayElement.textContent).then(async () => {
    localCopyButton.classList.add('copied');
    await sleep(2000);
    localCopyButton.classList.add('fading');
    await sleep(1000);
    localCopyButton.classList.remove('copied', 'fading');
  });
};

const localExport = async function () {
  const storageLocal = await browser.storage.local.get();
  const stringifiedStorage = JSON.stringify(storageLocal, null, 2);
  const storageBlob = new Blob([stringifiedStorage], { type: 'application/json' });
  const blobUrl = URL.createObjectURL(storageBlob);

  const date = new Date(storageLocal.storageLastModified);

  const fourDigitYear = date.getFullYear().toString().padStart(4, '0');
  const twoDigitMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  const twoDigitDate = date.getDate().toString().padStart(2, '0');

  const dateString = `${fourDigitYear}-${twoDigitMonth}-${twoDigitDate}`;

  const tempLink = document.createElement('a');
  tempLink.href = blobUrl;
  tempLink.download = `XKit Backup @ ${dateString}.json`;

  document.documentElement.appendChild(tempLink);
  tempLink.click();
  tempLink.parentNode.removeChild(tempLink);
  URL.revokeObjectURL(blobUrl);
};

const localRestore = async function () {
  const importText = localImportTextarea.value;

  try {
    const parsedStorage = JSON.parse(importText);
    await browser.storage.local.set(parsedStorage);

    localRestoreButton.disabled = true;
    localRestoreButton.textContent = 'Successfully restored!';
    localImportTextarea.value = '';
    document.querySelector('a[href="#configuration"]').classList.add('outdated');

    await sleep(3000);
    localRestoreButton.disabled = false;
    localRestoreButton.textContent = 'Restore';
  } catch (exception) {
    console.error(exception);
  }
};

const renderLocalBackup = async function () {
  updateLocalExportDisplay();
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      updateLocalExportDisplay();
    }
  });

  localCopyButton.addEventListener('click', localCopy);
  localDownloadButton.addEventListener('click', localExport);

  localRestoreButton.addEventListener('click', localRestore);
};

renderLocalBackup();

document.querySelectorAll('#backup details').forEach(details => details.addEventListener('toggle', ({ currentTarget }) => {
  if (currentTarget.open) {
    [...currentTarget.parentNode.children]
      .filter(element => element !== currentTarget)
      .forEach(sibling => { sibling.open = false; });
  }
}));
