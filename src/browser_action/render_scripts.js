const configSection = document.getElementById('configuration');
const configSectionLink = document.querySelector('a[href="#configuration"]');
const scriptsDiv = configSection.querySelector('.scripts');

const { getURL } = browser.runtime;

const getInstalledScripts = async function () {
  const url = getURL('/scripts/_index.json');
  const file = await fetch(url);
  const installedScripts = await file.json();

  return installedScripts;
};

const writeEnabled = async function (event) {
  const { checked, id } = event.currentTarget;
  const { parentNode: { parentNode: detailsElement } } = event.currentTarget;
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

const debounce = (func, ms) => {
  let timeoutID;
  return (...args) => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => func(...args), ms);
  };
};

const writePreference = async function ({ target }) {
  const { id } = target;
  const [scriptName, preferenceType, preferenceName] = id.split('.');
  const storageKey = `${scriptName}.preferences.${preferenceName}`;

  switch (preferenceType) {
    case 'checkbox':
      browser.storage.local.set({ [storageKey]: target.checked });
      break;
    case 'text':
    case 'color':
    case 'select':
    case 'textarea':
      browser.storage.local.set({ [storageKey]: target.value });
      break;
  }
};

const renderPreferences = async function ({ scriptName, preferences, preferenceList }) {
  for (const [key, preference] of Object.entries(preferences)) {
    const storageKey = `${scriptName}.preferences.${key}`;
    const { [storageKey]: savedPreference } = await browser.storage.local.get(storageKey);
    preference.value = savedPreference ?? preference.default;

    const preferenceTemplateClone = document.getElementById(`${preference.type}-preference`).content.cloneNode(true);

    const preferenceInput = preferenceTemplateClone.querySelector('input, select, textarea, iframe');
    preferenceInput.id = `${scriptName}.${preference.type}.${key}`;

    const preferenceLabel = preferenceTemplateClone.querySelector('label');
    if (preferenceLabel) {
      preferenceLabel.textContent = preference.label || key;
      preferenceLabel.setAttribute('for', `${scriptName}.${preference.type}.${key}`);
    } else {
      preferenceInput.title = preference.label || key;
    }

    switch (preference.type) {
      case 'text':
      case 'textarea':
        preferenceInput.addEventListener('input', debounce(writePreference, 500));
        break;
      case 'iframe':
        break;
      default:
        preferenceInput.addEventListener('input', writePreference);
    }

    switch (preference.type) {
      case 'checkbox':
        preferenceInput.checked = preference.value;
        break;
      case 'select':
        for (const { value, label } of preference.options) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          option.selected = value === preference.value;
          preferenceInput.appendChild(option);
        }
        break;
      case 'color':
        preferenceInput.value = preference.value;
        $(preferenceInput)
          .on('change.spectrum', writePreference)
          .spectrum({
            preferredFormat: 'hex',
            showInput: true,
            showInitial: true,
            allowEmpty: true
          });
        break;
      case 'iframe':
        preferenceInput.addEventListener('load', () => {
          const callback = () => { preferenceInput.height = preferenceInput.contentDocument.documentElement.scrollHeight; };
          callback();
          const observer = new ResizeObserver(callback);
          observer.observe(preferenceInput.contentDocument.documentElement);
        });
        preferenceInput.src = preference.src;
        break;
      default:
        preferenceInput.value = preference.value;
    }

    preferenceList.appendChild(preferenceTemplateClone);
  }
};

const renderScripts = async function () {
  const scriptClones = [];
  scriptsDiv.textContent = '';

  const installedScripts = await getInstalledScripts();
  const { enabledScripts = [] } = await browser.storage.local.get('enabledScripts');

  const orderedEnabledScripts = installedScripts.filter(scriptName => enabledScripts.includes(scriptName));
  const disabledScripts = installedScripts.filter(scriptName => enabledScripts.includes(scriptName) === false);

  for (const scriptName of [...orderedEnabledScripts, ...disabledScripts]) {
    const url = getURL(`/scripts/${scriptName}.json`);
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

    if (Object.keys(preferences).length !== 0) {
      const preferenceList = scriptTemplateClone.querySelector('.preferences');
      renderPreferences({ scriptName, preferences, preferenceList });
    }

    scriptClones.push(scriptTemplateClone);
  }

  scriptsDiv.append(...scriptClones);
};

renderScripts().then(() => {
  const main = document.querySelector('main');
  main.style.minWidth = `${main.getBoundingClientRect().width}px`;
});

configSectionLink.addEventListener('click', ({ currentTarget }) => {
  if (currentTarget.classList.contains('outdated')) {
    currentTarget.classList.remove('outdated');
    renderScripts();
  }
});
