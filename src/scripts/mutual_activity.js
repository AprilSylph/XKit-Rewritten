import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';

const NOTIFICATION_SECTION_SELECTOR = keyToCss('notifications');
const NOTIFICATION_SELECTOR = keyToCss('notification');
const FOLLOWED_SELECTOR = keyToCss('followed');
const MINI_HEADING_SELECTOR = keyToCss('miniHeading');
const STATS_CONTAINER_SELECTOR = keyToCss('statsContainer');
const BUTTON_SELECTOR = keyToCss('button');
const FILTER_BUTTON_SELECTOR = `${STATS_CONTAINER_SELECTOR} > ${MINI_HEADING_SELECTOR} ${BUTTON_SELECTOR}`;
const ROLLUP_CHECKBOX_SELECTOR = '[aria-labelledby="rollups"]';
const CHECKBOX_STATE_SELECTOR = keyToCss('box');
const GLASS_CONTAINER_SELECTOR = '#glass-container';
const APPLY_FILTERS_SELECTOR = `${GLASS_CONTAINER_SELECTOR} ${keyToCss(
  'button'
)}${keyToCss('default')}`;
const CLOSE_FILTER_DIALOG_SELECTOR = '[aria-label="Close"]';
const ACTIVITY_POPOVER_SELECTOR = keyToCss('activityPopover');
const ACTIVITY_BODY_SELECTOR = '.usqcu';

const MUTUAL_ACTIVITY_CLASS = 'xkit-mutual-activity';
const HIDDEN_DIALOG_CLASS = `${MUTUAL_ACTIVITY_CLASS}-dialog-hidden`;
const FILTER_CONTAINER_CLASS = `${MUTUAL_ACTIVITY_CLASS}-filter-container`;
const IS_ACTIVATED_STORAGE_KEY = 'mutualActivity.isActivated';

const nonMutualStyleElement = buildStyle(
  `:not(${ACTIVITY_POPOVER_SELECTOR}) :is(${NOTIFICATION_SELECTOR}):not(${FOLLOWED_SELECTOR}){ display: none !important; }`
);

const disableGroupNotifications = async () => {
  const glassContainer = document.querySelector(GLASS_CONTAINER_SELECTOR);
  const filterButton = document.querySelector(FILTER_BUTTON_SELECTOR);
  glassContainer.classList.add(HIDDEN_DIALOG_CLASS);
  filterButton.click();
  filterButton.setAttribute('disabled', true);

  const checkboxState =
    document.querySelector(
      `${ROLLUP_CHECKBOX_SELECTOR} + ${CHECKBOX_STATE_SELECTOR}`
    ).childElementCount > 0;

  if (checkboxState) {
    document.querySelector(ROLLUP_CHECKBOX_SELECTOR).click();
    document.querySelector(APPLY_FILTERS_SELECTOR).click();
  } else {
    document.querySelector(CLOSE_FILTER_DIALOG_SELECTOR).click();
  }

  glassContainer.classList.remove(HIDDEN_DIALOG_CLASS);
  filterButton.removeAttribute('disabled');
};

const enableFilter = () => {
  document.head.append(nonMutualStyleElement);
  const notificationSection = document.querySelector(
    NOTIFICATION_SECTION_SELECTOR
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
    className: MUTUAL_ACTIVITY_CLASS
  });
  const mutualActivityLabel = Object.assign(document.createElement('label'), {
    className: MUTUAL_ACTIVITY_CLASS,
    textContent: 'Mutuals only',
    for: MUTUAL_ACTIVITY_CLASS
  });
  const mutualActivityToggleButton = Object.assign(
    document.createElement('input'),
    {
      className: `${MUTUAL_ACTIVITY_CLASS} toggle-button`,
      type: 'checkbox',
      name: MUTUAL_ACTIVITY_CLASS,
      checked: isActivated
    }
  );

  mutualActivity.appendChild(mutualActivityLabel);
  mutualActivity.appendChild(mutualActivityToggleButton);

  const activityBar = document.querySelector(FILTER_BUTTON_SELECTOR);

  $(activityBar).wrap(`<span class="${FILTER_CONTAINER_CLASS}"></span>`);
  $(activityBar).before(mutualActivity);

  mutualActivity.addEventListener('input', toggleFilter);
};

const removeToggleButton = () => {
  document.querySelector(`span.${MUTUAL_ACTIVITY_CLASS}`)?.remove();
  $(FILTER_BUTTON_SELECTOR).unwrap(`span.${FILTER_CONTAINER_CLASS}`);
};

export const main = async () => {
  pageModifications.register(ACTIVITY_BODY_SELECTOR, createToggleButton);
};

export const clean = async () => {
  disableFilter();
  removeToggleButton();
  pageModifications.unregister(createToggleButton);
};

export const stylesheet = true;
