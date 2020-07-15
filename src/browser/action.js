const {getURL} = browser.runtime;

async function getInstalledScripts() {
  const url = getURL('/src/scripts/.index.json');
  const file = await fetch(url);
  const installedScripts = await file.json();

  return installedScripts;
}

async function writeEnabled(event) {
  const {checked, id} = event.target;
  let {enabledScripts} = await browser.storage.local.get('enabledScripts');

  if (!enabledScripts) {
    enabledScripts = [];
  }

  if (checked) {
    enabledScripts.push(id);
  } else {
    enabledScripts = enabledScripts.filter(x => x !== id);
  }

  browser.storage.local.set({enabledScripts});
}

async function renderScripts() {
  const target = document.getElementById('scripts');
  const installedScripts = await getInstalledScripts();
  let {enabledScripts} = await browser.storage.local.get('enabledScripts');

  if (!enabledScripts) {
    enabledScripts = [];
  }

  installedScripts.forEach(({name, title}) => {
    const listItem = document.createElement('li');

    const input = document.createElement('input');
    input.id = name;
    input.setAttribute('type', 'checkbox');
    input.checked = enabledScripts.includes(name);
    input.addEventListener('input', writeEnabled);
    listItem.appendChild(input);

    const label = document.createElement('label');
    label.setAttribute('for', name);
    label.textContent = title;
    listItem.appendChild(label);

    target.appendChild(listItem);
  });
}

renderScripts();
