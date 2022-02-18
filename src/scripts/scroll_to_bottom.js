import { keyToClasses, keyToCss, resolveExpressions } from '../util/css_map.js';
import { translate } from '../util/language_data.js';
import { pageModifications } from '../util/mutations.js';

let knightRiderLoaderSelector;
let peeprSelector;
let timelineSelector;
let scrollToBottomButton;
let scrollToBottomIcon;
let active = false;
let scrollElement;

const scrollToBottom = () => {
  scrollElement.scrollTo({ top: scrollElement.scrollHeight });
  if (scrollElement.querySelector(knightRiderLoaderSelector) === null) {
    stopScrolling();
  }
};
const observer = new ResizeObserver(scrollToBottom);

const startScrolling = () => {
  scrollElement = document.querySelector(peeprSelector) || document.documentElement;
  observer.observe(scrollElement.querySelector(timelineSelector));
  active = true;
  scrollToBottomIcon.style.fill = 'rgb(var(--yellow))';
  scrollToBottom();
};

const stopScrolling = () => {
  observer.disconnect();
  active = false;
  if (scrollToBottomIcon) scrollToBottomIcon.style.fill = '';
};

const onClick = () => active ? stopScrolling() : startScrolling();
const onKeyDown = ({ key }) => key === '.' && stopScrolling();

const checkForButtonRemoved = () => {
  const buttonWasRemoved = document.documentElement.contains(scrollToBottomButton) === false;
  if (buttonWasRemoved) {
    if (active) stopScrolling();
    pageModifications.unregister(checkForButtonRemoved);
  }
};

const addButtonToPage = async function ([scrollToTopButton]) {
  if (!scrollToBottomButton) {
    const hiddenClasses = await keyToClasses('hidden');

    scrollToBottomButton = scrollToTopButton.cloneNode(true);
    hiddenClasses.forEach(className => scrollToBottomButton.classList.remove(className));
    scrollToBottomButton.removeAttribute('aria-label');
    scrollToBottomButton.style.marginTop = '0.5ch';
    scrollToBottomButton.style.transform = 'rotate(180deg)';
    scrollToBottomButton.addEventListener('click', onClick);

    scrollToBottomIcon = scrollToBottomButton.querySelector('svg');
    scrollToBottomIcon.style.fill = active ? 'rgb(var(--yellow))' : '';
  }

  scrollToTopButton.after(scrollToBottomButton);
  scrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);
  pageModifications.register('*', checkForButtonRemoved);
};

export const main = async function () {
  knightRiderLoaderSelector = await resolveExpressions`
    ${keyToCss('timeline')} ${keyToCss('loader')} ${keyToCss('knightRiderLoader')}
  `;
  peeprSelector = await resolveExpressions`
    ${keyToCss('peepr')},
    ${keyToCss('drawerContent')} > ${keyToCss('scrollContainer')}
  `;
  timelineSelector = await keyToCss('timeline');

  const scrollToTopLabel = await translate('Scroll to top');
  pageModifications.register(`button[aria-label="${scrollToTopLabel}"]`, addButtonToPage);
};

export const clean = async function () {
  pageModifications.unregister(addButtonToPage);
  pageModifications.unregister(checkForButtonRemoved);
  stopScrolling();
  scrollToBottomButton?.remove();
};
