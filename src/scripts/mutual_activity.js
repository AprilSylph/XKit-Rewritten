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
const activityBarSelector = `${statsContainerSelector} > ${miniHeadingSelector} ${buttonSelector}`;
const rollupSelector = keyToCss('rollup');
const rollupCheckboxSelector = '[aria-labelledby="rollups"]';
const glassContainerSelector = '#glass-container';
const applyFiltersSelector = `${glassContainerSelector} ${keyToCss('button')}${keyToCss('default')}`;

const hiddenDialogClass = 'xkit-mutual-activity-dialog-hidden';

const styleElement = buildStyle();
const buildCss = () =>
  `:is(${notificationSelector}):not(${followedSelector}){ display: none !important; }`;

const findRolledUpNotifications = async (rollupSelector, activityBarSelector, rollupCheckboxSelector, applyFiltersSelector, glassContainerSelector, hiddenDialogClass) => {
  if (document.querySelectorAll(rollupSelector).length > 0) {
    const clickEvent = new Event('click', {
      bubbles: true
    });

    document.querySelector(glassContainerSelector).classList.add(hiddenDialogClass);
    document.querySelector(activityBarSelector).dispatchEvent(clickEvent);
    document.querySelector(rollupCheckboxSelector).click();
    document.querySelector(applyFiltersSelector).click();
    document.querySelector(glassContainerSelector).classList.remove(hiddenDialogClass);
  }
};

const processNotifications = () => inject(findRolledUpNotifications, [rollupSelector, activityBarSelector, rollupCheckboxSelector, applyFiltersSelector, glassContainerSelector, hiddenDialogClass]);

const enableFilter = () => {
  styleElement.textContent = buildCss();
  document.head.append(styleElement);
  const notificationSection = document.querySelector(
    notificationSectionSelector
  );
  const scrollEvent = new Event('scroll', {
    bubbles: true
  });

  notificationSection.dispatchEvent(scrollEvent);
  pageModifications.register(notificationSelector, processNotifications);
};

const disableFilter = () => {
  pageModifications.unregister(processNotifications);
  styleElement.remove();
};

const toggleFilter = ({ target }) => {
  target?.checked ? enableFilter() : disableFilter();
};

const createToggleButton = () => {
  if (document.querySelector('.usqcu') === null) {
    return;
  }
  console.log('createToggleButton');
  const mutualActivity = Object.assign(document.createElement('span'), { className: 'mutual-activity' });
  const mutualActivityLabel = Object.assign(document.createElement('label'), { className: 'mutual-activity', textContent: 'Mutuals only', for: 'mutual-activity' });
  const mutualActivityToggleButton = Object.assign(document.createElement('input'), { className: 'mutual-activity toggle-button', type: 'checkbox', name: 'mutual-activity' });
  mutualActivity.appendChild(mutualActivityLabel);
  mutualActivity.appendChild(mutualActivityToggleButton);

  const activityBar = document.querySelector(activityBarSelector);
  $(activityBar).wrap('<span class="filter-container"></span>');
  $(activityBar).before(mutualActivity);

  mutualActivity.addEventListener('input', toggleFilter);
};

export const main = async () => {
  createToggleButton();

  pageModifications.register('.usqcu', createToggleButton);
};

export const clean = async () => {
  disableFilter();
  pageModifications.unregister(createToggleButton);
};

export const stylesheet = true;
