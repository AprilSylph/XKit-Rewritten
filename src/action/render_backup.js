const exportForm = document.getElementById('export');
const exportValueTextarea = document.getElementById('export-value');
const exportCopyButton = document.getElementById('export-copy');
const exportDownloadButton = document.getElementById('export-download');

const importForm = document.getElementById('import');
const importValueTextarea = document.getElementById('import-value');
const importSubmitButton = document.getElementById('import-submit');

const overwriteConfirmationDialog = document.getElementById('overwrite-confirmation');
const overwriteSizeOldSpan = document.getElementById('overwrite-size-old');
const overwriteSizeNewSpan = document.getElementById('overwrite-size-new');
const overwriteCancelButton = document.getElementById('overwrite-cancel');
const overwriteConfirmButton = document.getElementById('overwrite-confirm');

const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), ms));

class UserInterrupt extends Error { name = 'UserInterrupt'; }

const onStorageChanged = async function () {
  const storageLocal = await browser.storage.local.get();
  exportValueTextarea.value = JSON.stringify(storageLocal, null, 2);
};

const localCopy = () => {
  if (exportCopyButton.classList.contains('copied')) { return; }

  navigator.clipboard.writeText(exportValueTextarea.value).then(async () => {
    exportCopyButton.classList.add('copied');
    await sleep(2000);
    exportCopyButton.classList.add('fading');
    await sleep(1000);
    exportCopyButton.classList.remove('copied', 'fading');
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

  const tempLink = Object.assign(document.createElement('a'), {
    href: blobUrl,
    download: `XKit Backup @ ${dateString}.json`,
  });

  document.documentElement.appendChild(tempLink);
  tempLink.click();
  tempLink.remove();
  URL.revokeObjectURL(blobUrl);
};

/** @type {(event: SubmitEvent) => void} */
function onExportSubmit (event) {
  event.preventDefault();
  if (event.submitter === exportCopyButton) localCopy();
  if (event.submitter === exportDownloadButton) localExport();
}

const getByteLength = (value) => {
  const textEncoder = new TextEncoder();
  const { byteLength } = textEncoder.encode(JSON.stringify(value, null, 2));
  return byteLength;
};

const unitFormat = new Intl.NumberFormat('en-GB', {
  style: 'unit',
  unit: 'kilobyte',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const showOverwriteConfirmationDialog = (currentStorage, parsedStorage) => new Promise((resolve, reject) => {
  overwriteConfirmationDialog.showModal();

  overwriteSizeOldSpan.textContent = unitFormat.format(getByteLength(currentStorage) / 1024);
  overwriteSizeNewSpan.textContent = unitFormat.format(getByteLength(parsedStorage) / 1024);

  overwriteCancelButton.addEventListener('click', () => {
    overwriteConfirmationDialog.close();
    reject(new UserInterrupt());
  });

  overwriteConfirmButton.addEventListener('click', () => {
    overwriteConfirmationDialog.close();
    resolve();
  });
});

/** @type {(event: SubmitEvent) => Promise<void>} */
async function onImportSubmit (event) {
  event.preventDefault();

  const importText = importValueTextarea.value;

  try {
    importSubmitButton.disabled = true;

    const currentStorage = await browser.storage.local.get();
    const parsedStorage = JSON.parse(importText);

    if (Object.keys(currentStorage).length !== 0) {
      await showOverwriteConfirmationDialog(currentStorage, parsedStorage);
    }

    await browser.storage.local.clear();
    await browser.storage.local.set(parsedStorage);

    importSubmitButton.classList.add('success');
    importSubmitButton.textContent = 'Successfully restored!';
    importValueTextarea.value = '';
    document.getElementById('configuration-tab').classList.add('outdated');

    await sleep(3000);
  } catch (exception) {
    if (!(exception instanceof UserInterrupt)) {
      console.error(exception);

      importSubmitButton.classList.add('failure');
      importSubmitButton.textContent = exception instanceof SyntaxError
        ? 'Failed to parse backup contents!'
        : 'Could not restore backup!';

      await sleep(3000);
    }
  } finally {
    importSubmitButton.disabled = false;
    importSubmitButton.classList.remove('success', 'failure');
    importSubmitButton.textContent = 'Restore';
  }
}

const renderLocalBackup = async function () {
  onStorageChanged();
  browser.storage.local.onChanged.addListener(onStorageChanged);

  exportForm.addEventListener('submit', onExportSubmit);
  importForm.addEventListener('submit', onImportSubmit);
};

renderLocalBackup();
