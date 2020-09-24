const { getURL } = browser.runtime;

const getInstalledScripts = async function () {
  const url = getURL('/src/scripts/_index.json');
  const file = await fetch(url);
  const installedScripts = await file.json();

  return installedScripts;
};

const writeEnabled = async function (event) {
  const { checked, id } = event.target;
  const { parentNode: { parentNode: detailsElement } } = event.target;
  let { enabledScripts = [] } = await browser.storage.local.get('enabledScripts');

  if (checked) {
    enabledScripts.push(id);
    detailsElement.classList.remove('disabled');
  } else {
    enabledScripts = enabledScripts.filter(x => x !== id);
    detailsElement.classList.add('disabled');
  }

  browser.storage.local.set({ enabledScripts });
};

const writePreference = async function (event) {
  const { id } = event.target;
  const [scriptName, preferenceType, preferenceName] = id.split('.');
  const storageKey = `${scriptName}.preferences.${preferenceName}`;

  switch (preferenceType) {
    case 'checkbox':
      browser.storage.local.set({ [storageKey]: event.target.checked });
      break;
    case 'text':
    case 'color':
    case 'select':
      browser.storage.local.set({ [storageKey]: event.target.value });
      break;
  }
};

const renderScripts = async function () {
  const configSection = document.getElementById('configuration');
  const installedScripts = await getInstalledScripts();
  const { enabledScripts = [] } = await browser.storage.local.get('enabledScripts');
  const orderedEnabledScripts = installedScripts.filter(scriptName => enabledScripts.includes(scriptName));
  const disabledScripts = installedScripts.filter(scriptName => enabledScripts.includes(scriptName) === false);

  for (const scriptName of [...orderedEnabledScripts, ...disabledScripts]) {
    const url = getURL(`/src/scripts/${scriptName}.json`);
    const file = await fetch(url);
    const { title = scriptName, description = '', icon = {}, preferences = {} } = await file.json();

    const scriptTemplateClone = document.getElementById('script').content.cloneNode(true);

    if (enabledScripts.includes(scriptName) === false) {
      const detailsElement = scriptTemplateClone.querySelector('details.script');
      detailsElement.classList.add('disabled');
    }

    if (icon.class_name !== undefined) {
      const iconDiv = scriptTemplateClone.querySelector('div.icon');
      iconDiv.style.backgroundColor = icon.background_color || '#ffffff';

      const iconInner = iconDiv.querySelector('i');
      iconInner.classList.add(icon.class_name);
      iconInner.style.color = icon.color || '#000000';
    }

    const titleHeading = scriptTemplateClone.querySelector('h4.title');
    titleHeading.textContent = title;

    if (description !== '') {
      const descriptionParagraph = scriptTemplateClone.querySelector('p.description');
      descriptionParagraph.textContent = description;
    }

    const enabledInput = scriptTemplateClone.querySelector('input.toggle-button');
    enabledInput.id = scriptName;
    enabledInput.checked = enabledScripts.includes(scriptName);
    enabledInput.addEventListener('input', writeEnabled);

    const preferenceList = scriptTemplateClone.querySelector('.preferences');

    for (const [key, preference] of Object.entries(preferences)) {
      const storageKey = `${scriptName}.preferences.${key}`;
      const { [storageKey]: savedPreference } = await browser.storage.local.get(storageKey);
      preference.value = savedPreference === undefined ? preference.default : savedPreference;

      const preferenceTemplateClone = document.getElementById(`${preference.type}-preference`).content.cloneNode(true);

      const preferenceLabel = preferenceTemplateClone.querySelector('label');
      preferenceLabel.textContent = preference.label;
      preferenceLabel.setAttribute('for', `${scriptName}.${preference.type}.${key}`);

      const inputType = {
        checkbox: 'input',
        text: 'input',
        color: 'input',
        select: 'select',
      }[preference.type];

      const preferenceInput = preferenceTemplateClone.querySelector(inputType);
      preferenceInput.id = `${scriptName}.${preference.type}.${key}`;
      preferenceInput.addEventListener('input', writePreference);

      switch (preference.type) {
        case 'checkbox':
          preferenceInput.checked = preference.value;
          break;
        case 'text':
        case 'color':
          preferenceInput.value = preference.value;
          break;
        case 'select':
          for (const [value, text] of Object.entries(preference.options)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            option.selected = value === preference.value;
            preferenceInput.appendChild(option);
          }
          break;
      }

      preferenceList.appendChild(preferenceTemplateClone);
    }

    configSection.appendChild(scriptTemplateClone);
  }

  const $makeSpectrum = $(configSection).find('.makeSpectrum');

  $makeSpectrum.spectrum({
    preferredFormat: 'hex',
    showInput: true,
    showInitial: true,
    allowEmpty: true,
  });
  $makeSpectrum.on('change.spectrum', writePreference);
};

renderScripts();
