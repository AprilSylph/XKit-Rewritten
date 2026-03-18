const exportForm = document.getElementById('export');
const exportValueTextarea = document.getElementById('export-value');
const exportCopyButton = document.getElementById('export-copy');
const exportDownloadButton = document.getElementById('export-download');

const importForm = document.getElementById('import');
const importValueTextarea = document.getElementById('import-value');
const importSubmitButton = document.getElementById('import-submit');
const importWarningElement = document.getElementById('import-warning');

const sleep = ms => new Promise(resolve => setTimeout(() => resolve(), ms));

const onStorageChanged = async function () {
  const storageLocal = await browser.storage.local.get();
  const stringifiedStorage = JSON.stringify(storageLocal, null, 2);

  exportValueTextarea.value = stringifiedStorage;
  importWarningElement.dataset.hidden = Object.keys(storageLocal).length === 0;
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

/** @type {(event: SubmitEvent) => Promise<void>} */
async function onImportSubmit (event) {
  event.preventDefault();

  const importText = importValueTextarea.value;

  try {
    importSubmitButton.disabled = true;

    const parsedStorage = JSON.parse(importText);

    importWarningElement.dataset.forceHidden = importWarningElement.dataset.hidden;

    await browser.storage.local.clear();
    await browser.storage.local.set(parsedStorage);

    importSubmitButton.classList.add('success');
    importSubmitButton.textContent = 'Successfully restored!';
    importValueTextarea.value = '';
    document.getElementById('configuration-tab').classList.add('outdated');
  } catch (exception) {
    importSubmitButton.classList.add('failure');
    importSubmitButton.textContent = exception instanceof SyntaxError
      ? 'Failed to parse backup contents!'
      : 'Failed to restore!';
    console.error(exception);
  } finally {
    await sleep(3000);
    importSubmitButton.disabled = false;
    importSubmitButton.classList.remove('success', 'failure');
    importSubmitButton.textContent = 'Restore';
    delete importWarningElement.dataset.forceHidden;
  }
}

const renderLocalBackup = async function () {
  onStorageChanged();
  browser.storage.local.onChanged.addListener(onStorageChanged);

  exportForm.addEventListener('submit', onExportSubmit);
  importForm.addEventListener('submit', onImportSubmit);
};

renderLocalBackup();
