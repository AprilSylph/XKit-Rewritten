const backupSection = document.getElementById('backup');
const storageAreasDiv = backupSection.querySelector('.storage-areas');
const backupSectionLink = document.querySelector('a[href="#backup"]');

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
};

renderBackup();

backupSectionLink.addEventListener('click', () => {
  storageAreasDiv.textContent = '';
  renderBackup();
});
