import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';
import { inject } from '../util/inject.js';

const notificationSectionSelector = keyToCss('notifications');
const notificationSelector = keyToCss('notification');
const followedSelector = keyToCss('followed');
const miniHeadingSelector = keyToCss('miniHeading');
const statsContainerSelector = keyToCss('statsContainer');
const buttonSelector = keyToCss('button');
const filterButtonSelector = `${statsContainerSelector} > ${miniHeadingSelector} ${buttonSelector}`;
const rollupSelector = keyToCss('rollup');
const rollupCheckboxSelector = '[aria-labelledby="rollups"]';
const glassContainerSelector = '#glass-container';
const applyFiltersSelector = `${glassContainerSelector} ${keyToCss('button')}${keyToCss('default')}`;

const hiddenDialogClass = 'xkit-mutual-activity-dialog-hidden';
const mutualActivityClass = 'xkit-mutual-activity';
const IS_ACTIVATED_STORAGE_KEY = 'mutualActivity.isActivated';

const styleElement = buildStyle();
const buildCss = () =>
  `:is(${notificationSelector}):not(${followedSelector}){ display: none !important; }`;

const findRolledUpNotifications = async (rollupSelector, filterButtonSelector, rollupCheckboxSelector, applyFiltersSelector, glassContainerSelector, hiddenDialogClass) => {
  if (document.querySelectorAll(rollupSelector).length > 0) {
    const clickEvent = new Event('click', {
      bubbles: true
    });

    document.querySelector(glassContainerSelector).classList.add(hiddenDialogClass);
    document.querySelector(filterButtonSelector).dispatchEvent(clickEvent);
    document.querySelector(rollupCheckboxSelector).click();
    document.querySelector(applyFiltersSelector).click();
    document.querySelector(glassContainerSelector).classList.remove(hiddenDialogClass);
  }
};

const processNotifications = () => inject(findRolledUpNotifications, [rollupSelector, filterButtonSelector, rollupCheckboxSelector, applyFiltersSelector, glassContainerSelector, hiddenDialogClass]);

const enableFilter = () => {
  document.head.append(styleElement);
  const notificationSection = document.querySelector(
    notificationSectionSelector
  );
  const scrollEvent = new Event('scroll', {
    bubbles: true
  });

  notificationSection.dispatchEvent(scrollEvent);
  pageModifications.register(notificationSelector, processNotifications);
  browser.storage.local.set({ [IS_ACTIVATED_STORAGE_KEY]: true });
};

const disableFilter = () => {
  pageModifications.unregister(processNotifications);
  styleElement.remove();
  browser.storage.local.set({ [IS_ACTIVATED_STORAGE_KEY]: false });
};

const toggleFilter = ({ target }) => {
  target?.checked ? enableFilter() : disableFilter();
};

const createToggleButton = async () => {
  const { [IS_ACTIVATED_STORAGE_KEY]: isActivated = false } = await browser.storage.local.get(IS_ACTIVATED_STORAGE_KEY);
  if (document.querySelector('.usqcu') === null) {
    return;
  }

  toggleFilter({ target: { checked: isActivated } });
  const mutualActivity = Object.assign(document.createElement('span'), { className: mutualActivityClass });
  const mutualActivityLabel = Object.assign(document.createElement('label'), { className: mutualActivityClass, textContent: 'Mutuals only', for: mutualActivityClass });
  const mutualActivityToggleButton = Object.assign(document.createElement('input'), { className: `${mutualActivityClass} toggle-button`, type: 'checkbox', name: mutualActivityClass, checked: isActivated });
  mutualActivity.appendChild(mutualActivityLabel);
  mutualActivity.appendChild(mutualActivityToggleButton);

  const activityBar = document.querySelector(filterButtonSelector);
  $(activityBar).wrap('<span class="filter-container"></span>');
  $(activityBar).before(mutualActivity);

  mutualActivity.addEventListener('input', toggleFilter);
};

const removeToggleButton = () => {
  document.querySelector(`span.${mutualActivityClass}`)?.remove();
  $(filterButtonSelector).unwrap('span.filter-container');
};

export const main = async () => {
  styleElement.textContent = buildCss();
  pageModifications.register('.usqcu', createToggleButton);
};

export const clean = async () => {
  disableFilter();
  removeToggleButton();
  pageModifications.unregister(createToggleButton);
};

export const stylesheet = true;
