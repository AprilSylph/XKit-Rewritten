const {getURL} = browser.runtime;

async function getInstalledScripts() {
  const url = getURL('/src/scripts/_index.json');
  const file = await fetch(url);
  const installedScripts = await file.json();

  return installedScripts;
}

async function writeEnabled(event) {
  const {checked, id} = event.target;
  let {enabledScripts = []} = await browser.storage.local.get('enabledScripts');

  if (checked) {
    enabledScripts.push(id);
  } else {
    enabledScripts = enabledScripts.filter(x => x !== id);
  }

  browser.storage.local.set({enabledScripts});
}

async function renderScripts() {
  const scriptsSection = document.getElementById('scripts');
  const installedScripts = await getInstalledScripts();
  const {enabledScripts = []} = await browser.storage.local.get('enabledScripts');

  installedScripts.forEach(async name => {
    const url = getURL(`/src/scripts/${name}.json`);
    const file = await fetch(url);
    const {title = name, description = ''} = await file.json();

    const fieldset = document.createElement('fieldset');

    const legend = document.createElement('legend');
    legend.textContent = title;
    fieldset.appendChild(legend);

    if (description) {
      const p = document.createElement('p');
      p.textContent = description;
      fieldset.appendChild(p);
    }

    const unorderedList = document.createElement('ul');
    fieldset.appendChild(unorderedList);

    const listItem = document.createElement('li');
    unorderedList.appendChild(listItem);

    const input = document.createElement('input');
    input.id = name;
    input.setAttribute('type', 'checkbox');
    input.checked = enabledScripts.includes(name);
    input.addEventListener('input', writeEnabled);
    listItem.appendChild(input);

    const label = document.createElement('label');
    label.setAttribute('for', name);
    label.textContent = 'Enabled';
    listItem.appendChild(label);

    scriptsSection.appendChild(fieldset);
  });
}

renderScripts();
