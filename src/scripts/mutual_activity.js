import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';
import { getPreferences } from '../util/preferences.js';
import { dom } from '../util/dom.js';
import { buildSvg } from '../util/remixicon.js';

const NOTIFICATION_SECTION_SELECTOR = keyToCss('notifications');
const NOTIFICATION_SELECTOR = keyToCss('notification');
const FOLLOWED_SELECTOR = keyToCss('followed');
const ROLLUP_SELECTOR = keyToCss('rollup');
const MINI_HEADING_SELECTOR = keyToCss('miniHeading');
const STATS_CONTAINER_SELECTOR = keyToCss('statsContainer');
const BUTTON_SELECTOR = keyToCss('button');
const FILTER_BUTTON_SELECTOR = `${STATS_CONTAINER_SELECTOR} > ${MINI_HEADING_SELECTOR} ${BUTTON_SELECTOR}`;
const ROLLUP_CHECKBOX_SELECTOR = '[aria-labelledby="rollups"]';
const CHECKBOX_STATE_SELECTOR = `${ROLLUP_CHECKBOX_SELECTOR} + ${keyToCss(
  'box'
)}`;
const GLASS_CONTAINER_DIALOG_SELECTOR = keyToCss('glass');
const APPLY_FILTERS_SELECTOR = `#glass-container ${keyToCss(
  'button'
)}${keyToCss('default')}`;
const CLOSE_FILTER_DIALOG_SELECTOR = '[aria-label="Close"]';
const GROUP_SIMILAR_SECTION_SELECTOR = `${keyToCss('section')}:nth-child(1)`;
const GROUP_SIMILAR_LABEL_SELECTOR = 'label#rollups';

const MUTUAL_ACTIVITY_CLASS = 'xkit-mutual-activity';

const MUTUAL_ACTIVITY_STORAGE_KEY = 'mutual_activity';
const IS_ACTIVATED_STORAGE_KEY = `${MUTUAL_ACTIVITY_STORAGE_KEY}.isActivated`;
const SHOW_GROUPED_NOTIFICATIONS_PREFERENCE_KEY = 'showGroupedNotifications';

const nonMutualStyleElement = buildStyle(
  `${NOTIFICATION_SECTION_SELECTOR} ${NOTIFICATION_SELECTOR}:not(${FOLLOWED_SELECTOR}, ${ROLLUP_SELECTOR}) {
     display: none !important;
  }

  ${GROUP_SIMILAR_SECTION_SELECTOR} ${ROLLUP_CHECKBOX_SELECTOR} {
    pointer-events: none;
    cursor: not-allowed;
  }

  ${GROUP_SIMILAR_SECTION_SELECTOR} ${CHECKBOX_STATE_SELECTOR} {
    background-color: rgba(var(--black), 0.40) !important;
    cursor: not-allowed;
  }

  ${GROUP_SIMILAR_LABEL_SELECTOR} {
    color: rgba(var(--black), 0.40) !important;
  }

  ${GROUP_SIMILAR_SECTION_SELECTOR} {
    pointer-events: none;
  }

  ${GROUP_SIMILAR_SECTION_SELECTOR}::after {
    content: "⚠️ Controlled by XKit Mutual Activity";
  }
`
);

const toggleRollupCheckbox = (shouldToggleCheckbox) => {
  if (shouldToggleCheckbox) {
    document.querySelector(ROLLUP_CHECKBOX_SELECTOR).click();
    document.querySelector(APPLY_FILTERS_SELECTOR).click();
  } else {
    document.querySelector(CLOSE_FILTER_DIALOG_SELECTOR).click();
  }
};

const getRollupCheckboxState = () =>
  document.querySelector(CHECKBOX_STATE_SELECTOR).childElementCount > 0;

const isFilterDialogOpen = () =>
  document.querySelector(GLASS_CONTAINER_DIALOG_SELECTOR) !== null;

const toggleGroupedNotifications = async () => {
  const { showGroupedNotifications } = await getPreferences(
    MUTUAL_ACTIVITY_STORAGE_KEY
  );
  const filterButton = document.querySelector(FILTER_BUTTON_SELECTOR);

  if (!isFilterDialogOpen()) {
    filterButton.click();
  }

  toggleRollupCheckbox(getRollupCheckboxState() !== showGroupedNotifications);
};

const setIsActivated = async (isActivated) => {
  await browser.storage.local.set({ [IS_ACTIVATED_STORAGE_KEY]: isActivated });
};

const getIsActivated = () =>
  browser.storage.local.get(IS_ACTIVATED_STORAGE_KEY);

const enableFilter = () => {
  document.head.append(nonMutualStyleElement);

  const notificationSection = document.querySelector(
    NOTIFICATION_SECTION_SELECTOR
  );
  const scrollEvent = new Event('scroll', {
    bubbles: true
  });

  notificationSection.dispatchEvent(scrollEvent);
  toggleGroupedNotifications();
  setIsActivated(true);
};

const disableFilter = () => {
  nonMutualStyleElement.remove();
  toggleGroupedNotifications();
  setIsActivated(false);
};

const toggleFilter = async ({ target }) => {
  target?.checked ? enableFilter() : disableFilter();
};

const isOnActivityPage = () =>
  document.querySelector(NOTIFICATION_SECTION_SELECTOR) !== null;

const createToggleButton = async () => {
  if (!isOnActivityPage()) {
    return;
  }

  const { [IS_ACTIVATED_STORAGE_KEY]: isActivated = false } =
    await getIsActivated();

  toggleFilter({ target: { checked: isActivated } });

  const mutualActivity = dom(
    'span',
    { class: MUTUAL_ACTIVITY_CLASS },
    { input: toggleFilter },
    [
      buildSvg('ri-team-line'),
      dom(
        'label',
        { class: MUTUAL_ACTIVITY_CLASS, for: MUTUAL_ACTIVITY_CLASS },
        null,
        ['Mutuals only']
      ),
      Object.assign(document.createElement('input'), {
        className: `${MUTUAL_ACTIVITY_CLASS} toggle-button`,
        type: 'checkbox',
        name: MUTUAL_ACTIVITY_CLASS,
        checked: isActivated
      })
    ]
  );

  $(FILTER_BUTTON_SELECTOR).before(mutualActivity);
};

const removeToggleButton = () => {
  document.querySelector(`span.${MUTUAL_ACTIVITY_CLASS}`)?.remove();
};

export const onStorageChanged = async (changes) => {
  const {
    [`${MUTUAL_ACTIVITY_STORAGE_KEY}.preferences.${SHOW_GROUPED_NOTIFICATIONS_PREFERENCE_KEY}`]:
      showGroupedNotificationsChanges
  } = changes;

  if (
    showGroupedNotificationsChanges &&
    showGroupedNotificationsChanges.oldValue !== undefined
  ) {
    if (isOnActivityPage()) {
      toggleGroupedNotifications();
    }
  }
};

export const main = async () =>
  pageModifications.register(NOTIFICATION_SECTION_SELECTOR, createToggleButton);

export const clean = async () => {
  disableFilter();
  removeToggleButton();
  pageModifications.unregister(createToggleButton);
};

export const stylesheet = true;
