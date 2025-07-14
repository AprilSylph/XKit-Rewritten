import { html, render } from '../lib/lit-html/lit-html.js';
import { ref } from '../lib/lit-html/directives/ref.js';

const configSection = document.getElementById('configuration');
const configSectionLink = document.querySelector('a[href="#configuration"]');
const featuresDiv = configSection.querySelector('.features');

const enabledFeaturesKey = 'enabledScripts';
const specialAccessKey = 'specialAccess';

const getInstalledFeatures = async function () {
  const url = browser.runtime.getURL('/features/index.json');
  const file = await fetch(url);
  const installedFeatures = await file.json();

  return installedFeatures;
};

const writeEnabled = async function ({ currentTarget }) {
  const { checked, id } = currentTarget;
  const detailsElement = currentTarget.closest('details');
  let {
    [enabledFeaturesKey]: enabledFeatures = [],
    [specialAccessKey]: specialAccess = []
  } = await browser.storage.local.get();

  const hasPreferences = detailsElement.querySelector('.preferences:not(:empty)');
  if (hasPreferences) detailsElement.open = checked;

  if (checked) {
    enabledFeatures.push(id);
    detailsElement.classList.remove('disabled');
  } else {
    enabledFeatures = enabledFeatures.filter(x => x !== id);
    detailsElement.classList.add('disabled');

    if (detailsElement.dataset.deprecated === 'true' && !specialAccess.includes(id)) {
      specialAccess.push(id);
    }
  }

  browser.storage.local.set({
    [enabledFeaturesKey]: enabledFeatures,
    [specialAccessKey]: specialAccess
  });
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
  const [featureName, preferenceType, preferenceName] = id.split('.');
  const storageKey = `${featureName}.preferences.${preferenceName}`;

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

const Preference = ({ preferenceKey, preference, featureName }) => {
  const id = `${featureName}.${preference.type}.${preferenceKey}`;
  const label = preference.label || preferenceKey;
  const oninput = ['text', 'textarea'].includes(preference.type)
    ? debounce(writePreference, 500)
    : writePreference;

  switch (preference.type) {
    case 'checkbox':
      return html`
        <li>
          <input id=${id} type="checkbox" ?checked=${preference.value} @input=${oninput} />
          <label for=${id}>${label}</label>
        </li>
      `;
    case 'text':
      return html`
        <li>
          <label for=${id}>${label}</label>
          <input id=${id} type="text" spellcheck="false" value=${preference.value} @input=${oninput} />
        </li>
      `;
    case 'select':
      return html`
        <li>
          <label for=${id}>${label}</label>
          <select id=${id} @input=${oninput}>
            ${preference.options.map(({ value, label }) => html`
              <option value=${value} ?selected=${value === preference.value}>${label}</option>
            `)}
          </select>
        </li>
      `;
    case 'color':
      return html`
        <li>
          <input
            value=${preference.value}
            id=${id}
            type="text"
            ${ref(preferenceInput =>
              $(preferenceInput)
                .on('change.spectrum', writePreference)
                .spectrum({
                  preferredFormat: 'hex',
                  showInput: true,
                  showInitial: true,
                  allowEmpty: true
                })
            )}
          />
          <label for=${id}>${label}</label>
        </li>
      `;
    case 'textarea':
      return html`
        <li>
          <label for=${id}>${label}</label>
        </li>
        <li>
          <textarea id=${id} rows="5" spellcheck="false" @input=${oninput}>${preference.value}</textarea>
        </li>
      `;
    case 'iframe':
      return html`
        <li>
          <iframe title=${label} id=${id} src=${preference.src}></iframe>
        </li>
      `;
  }
};

const renderFeatures = async function () {
  const featureElements = [];

  const storageLocal = await browser.storage.local.get();

  const installedFeatures = await getInstalledFeatures();
  const {
    [enabledFeaturesKey]: enabledFeatures = [],
    [specialAccessKey]: specialAccess = []
  } = storageLocal;

  const orderedEnabledFeatures = installedFeatures.filter(featureName => enabledFeatures.includes(featureName));
  const disabledFeatures = installedFeatures.filter(featureName => enabledFeatures.includes(featureName) === false);

  for (const featureName of [...orderedEnabledFeatures, ...disabledFeatures]) {
    const url = browser.runtime.getURL(`/features/${featureName}/feature.json`);
    const file = await fetch(url);
    const {
      title = featureName,
      description = '',
      note = '',
      icon = {},
      help = '',
      relatedTerms = [],
      preferences = {},
      deprecated = false
    } = await file.json();

    const disabled = enabledFeatures.includes(featureName) === false;
    if (disabled && deprecated && !specialAccess.includes(featureName)) continue;

    const preferenceElements = Object.entries(preferences).map(([preferenceKey, preference]) => {
      const storageKey = `${featureName}.preferences.${preferenceKey}`;
      const { [storageKey]: savedPreference } = storageLocal;
      preference.value = savedPreference ?? preference.default;

      return Preference({ preferenceKey, preference, featureName });
    });

    featureElements.push(html`
      <details
        class="feature${disabled ? ' disabled' : ''}"
        data-related-terms=${relatedTerms}
        data-deprecated=${deprecated}
      >
        <summary>
          <div class="icon" style="background-color: ${icon.background_color || '#ffffff'}">
            <i class="ri-fw ${icon.class_name}" style="color: ${icon.color || '#000000'}"></i>
          </div>
          <div class="meta">
            <h4 class="title">${title}</h4>
            <p class="description">${description}</p>
          </div>
          <div class="buttons">
            <a class="help" target="_blank" href=${help}}>
              <i class="ri-fw ri-question-fill" style="color:rgb(var(--black))"></i>
            </a>
            <input
              id=${featureName}
              type="checkbox"
              ?checked=${!disabled}
              class="toggle-button"
              aria-label="Enable this feature"
              @input=${writeEnabled}
            />
          </div>
        </summary>
        <p class="note">${note}</p>
        <ul class="preferences">${preferenceElements}</ul>
      </details>
    `);
  }

  render(featureElements, featuresDiv);
};

renderFeatures();

configSectionLink.addEventListener('click', ({ currentTarget }) => {
  if (currentTarget.classList.contains('outdated')) {
    currentTarget.classList.remove('outdated');
    renderFeatures();
  }
});
