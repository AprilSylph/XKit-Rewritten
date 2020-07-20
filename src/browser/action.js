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

async function writePreference(event) {
  const {id, tagName, type} = event.target;
  const [scriptName, preferenceName] = id.split('.');
  const storageKey = `${scriptName}.preferences`;
  const {[storageKey]: savedPreferences = {}} = await browser.storage.local.get(storageKey);

  if (tagName === 'INPUT') {
    switch (type) {
      case 'checkbox':
        savedPreferences[preferenceName] = event.target.checked;
        break;
      case 'text':
        savedPreferences[preferenceName] = event.target.value;
        break;
    }
  }

  browser.storage.local.set({[storageKey]: savedPreferences});
}

async function renderScripts() {
  const scriptsSection = document.getElementById('scripts');
  const installedScripts = await getInstalledScripts();
  const {enabledScripts = []} = await browser.storage.local.get('enabledScripts');

  installedScripts.forEach(async name => {
    const url = getURL(`/src/scripts/${name}.json`);
    const file = await fetch(url);
    const {title = name, description = '', preferences = {}} = await file.json();

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
    input.type = 'checkbox';
    input.checked = enabledScripts.includes(name);
    input.addEventListener('input', writeEnabled);
    listItem.appendChild(input);

    const label = document.createElement('label');
    label.setAttribute('for', name);
    label.textContent = 'Enabled';
    listItem.appendChild(label);

    if (Object.keys(preferences).length !== 0) {
      const storageKey = `${name}.preferences`;
      const {[storageKey]: savedPreferences = {}} = await browser.storage.local.get(storageKey);

      Object.keys(preferences).forEach(x => {
        const preference = preferences[x];
        const savedPreference = savedPreferences[x] !== undefined ? savedPreferences[x] : preference.default;

        const preferenceListItem = document.createElement('li');

        if (['checkbox', 'text'].includes(preference.type)) {
          const preferenceInput = document.createElement('input');
          preferenceInput.id = `${name}.${x}`;
          preferenceInput.type = preference.type;
          preferenceInput.addEventListener('input', writePreference);

          const preferenceLabel = document.createElement('label');
          preferenceLabel.setAttribute('for', `${name}.${x}`);
          preferenceLabel.textContent = preference.label;

          switch (preference.type) {
            case 'checkbox':
              preferenceInput.checked = savedPreference;
              preferenceListItem.appendChild(preferenceInput);
              preferenceListItem.appendChild(preferenceLabel);
              break;
            case 'text':
              preferenceInput.value = savedPreference;
              preferenceLabel.style.display = 'block';
              preferenceListItem.appendChild(preferenceLabel);
              preferenceListItem.appendChild(preferenceInput);
              break;
          }
        }

        unorderedList.appendChild(preferenceListItem);
      });
    }

    scriptsSection.appendChild(fieldset);
  });
}

renderScripts();
