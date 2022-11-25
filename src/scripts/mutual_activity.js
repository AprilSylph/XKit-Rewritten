import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';

const notificationSectionSelector = keyToCss('notifications');
const notificationSelector = keyToCss('notification');
const followedSelector = keyToCss('followed');
const miniHeadingSelector = keyToCss('miniHeading');
const statsContainerSelector = keyToCss('statsContainer');
const buttonSelector = keyToCss('button');
const filterButtonSelector = `${statsContainerSelector} > ${miniHeadingSelector} ${buttonSelector}`;
const rollupCheckboxSelector = '[aria-labelledby="rollups"]';
const checkboxStateSelector = keyToCss('box');
const glassContainerSelector = '#glass-container';
const applyFiltersSelector = `${glassContainerSelector} ${keyToCss(
  'button'
)}${keyToCss('default')}`;
const closeFilterDialogSelector = '[aria-label="Close"]';
const activityPopoverSelector = keyToCss('activityPopover');
const activityBodySelector = '.usqcu';

const hiddenDialogClass = 'xkit-mutual-activity-dialog-hidden';
const mutualActivityClass = 'xkit-mutual-activity';
const filterContainerClass = `${mutualActivityClass}-filter-container`;
const IS_ACTIVATED_STORAGE_KEY = 'mutualActivity.isActivated';

const nonMutualStyleElement = buildStyle(
  `:not(${activityPopoverSelector}) :is(${notificationSelector}):not(${followedSelector}){ display: none !important; }`
);

const disableGroupNotifications = async () => {
  const glassContainer = document.querySelector(glassContainerSelector);
  const filterButton = document.querySelector(filterButtonSelector);
  glassContainer.classList.add(hiddenDialogClass);
  filterButton.click();
  filterButton.setAttribute('disabled', true);

  const checkboxState =
    document.querySelector(
      `${rollupCheckboxSelector} + ${checkboxStateSelector}`
    ).childElementCount > 0;

  if (checkboxState) {
    document.querySelector(rollupCheckboxSelector).click();
    document.querySelector(applyFiltersSelector).click();
  } else {
    document.querySelector(closeFilterDialogSelector).click();
  }

  glassContainer.classList.remove(hiddenDialogClass);
  filterButton.removeAttribute('disabled');
};

const enableFilter = () => {
  document.head.append(nonMutualStyleElement);
  const notificationSection = document.querySelector(
    notificationSectionSelector
  );
  const scrollEvent = new Event('scroll', {
    bubbles: true
  });

  notificationSection.dispatchEvent(scrollEvent);
  disableGroupNotifications();

  browser.storage.local.set({ [IS_ACTIVATED_STORAGE_KEY]: true });
};

const disableFilter = () => {
  nonMutualStyleElement.remove();
  browser.storage.local.set({ [IS_ACTIVATED_STORAGE_KEY]: false });
};

const toggleFilter = async ({ target }) => {
  target?.checked ? enableFilter() : disableFilter();
};

const createToggleButton = async () => {
  const { [IS_ACTIVATED_STORAGE_KEY]: isActivated = false } =
    await browser.storage.local.get(IS_ACTIVATED_STORAGE_KEY);

  if (document.querySelector('.usqcu') === null) {
    return;
  }

  toggleFilter({ target: { checked: isActivated } });

  const mutualActivity = Object.assign(document.createElement('span'), {
    className: mutualActivityClass
  });
  const mutualActivityLabel = Object.assign(document.createElement('label'), {
    className: mutualActivityClass,
    textContent: 'Mutuals only',
    for: mutualActivityClass
  });
  const mutualActivityToggleButton = Object.assign(
    document.createElement('input'),
    {
      className: `${mutualActivityClass} toggle-button`,
      type: 'checkbox',
      name: mutualActivityClass,
      checked: isActivated
    }
  );

  mutualActivity.appendChild(mutualActivityLabel);
  mutualActivity.appendChild(mutualActivityToggleButton);

  const activityBar = document.querySelector(filterButtonSelector);

  $(activityBar).wrap(`<span class="${filterContainerClass}"></span>`);
  $(activityBar).before(mutualActivity);

  mutualActivity.addEventListener('input', toggleFilter);
};

const removeToggleButton = () => {
  document.querySelector(`span.${mutualActivityClass}`)?.remove();
  $(filterButtonSelector).unwrap(`span.${filterContainerClass}`);
};

export const main = async () => {
  pageModifications.register(activityBodySelector, createToggleButton);
};

export const clean = async () => {
  disableFilter();
  removeToggleButton();
  pageModifications.unregister(createToggleButton);
};

export const stylesheet = true;
