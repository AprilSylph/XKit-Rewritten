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

  const now = new Date();

  const fourDigitYear = now.getFullYear().toString().padStart(4, '0');
  const twoDigitMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const twoDigitDate = now.getDate().toString().padStart(2, '0');

  const dateString = `${fourDigitYear}-${twoDigitMonth}-${twoDigitDate}`;

  const tempLink = document.createElement('a');
  tempLink.href = blobUrl;
  tempLink.download = `XKit Backup @ ${dateString}.json`;

  document.documentElement.appendChild(tempLink);
  tempLink.click();
  tempLink.remove();
  URL.revokeObjectURL(blobUrl);
};

const localRestore = async function () {
  // @ts-ignore
  const importText = localImportTextarea.value;

  try {
    const parsedStorage = JSON.parse(importText);
    await browser.storage.local.set(parsedStorage);

    // @ts-ignore
    localRestoreButton.disabled = true;
    // @ts-ignore
    localImportTextarea.value = '';
    document.querySelector('a[href="#configuration"]').classList.add('outdated');
    await sleep(3000);
    // @ts-ignore
    localRestoreButton.disabled = false;
  } catch (exception) {
    console.error(exception);
  }
};

const renderLocalBackup = async function () {
  updateLocalExportDisplay();
  // @ts-ignore
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
  // @ts-ignore
  if (currentTarget.open) {
    // @ts-ignore
    [...currentTarget.parentNode.children]
      .filter(element => element !== currentTarget)
      .forEach(sibling => { sibling.open = false; });
  }
}));
