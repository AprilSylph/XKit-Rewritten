import { keyToClasses, keyToCss } from '../utils/css_map.js';
import { translate } from '../utils/language_data.js';
import { pageModifications } from '../utils/mutations.js';
import { buildStyle } from '../utils/interface.js';

const scrollToBottomButtonId = 'xkit-scroll-to-bottom-button';
$(`[id="${scrollToBottomButtonId}"]`).remove();
const activeClass = 'xkit-scroll-to-bottom-active';

const loaderSelector = `
${keyToCss('timeline', 'blogRows')} > :is(${keyToCss('scrollContainer')}, .sortableContainer) + div,
${keyToCss('notifications')} + div
`;
const knightRiderLoaderSelector = `:is(${loaderSelector}) > ${keyToCss('knightRiderLoader')}`;

let scrollToBottomButton;
let active = false;

export const styleElement = buildStyle(`
.${activeClass} svg use {
  --icon-color-primary: rgb(var(--yellow));
}
`);

let timeoutID;

const onLoadersAdded = loaders => {
  if (active) {
    clearTimeout(timeoutID);
  }
};

const scrollToBottom = () => {
  clearTimeout(timeoutID);
  window.scrollTo({ top: document.documentElement.scrollHeight });

  timeoutID = setTimeout(() => {
    if (!document.querySelector(knightRiderLoaderSelector)) {
      stopScrolling();
    }
  }, 500);
};
const observer = new ResizeObserver(scrollToBottom);

const startScrolling = () => {
  observer.observe(document.documentElement);
  active = true;
  scrollToBottomButton.classList.add(activeClass);
  scrollToBottom();
};

const stopScrolling = () => {
  clearTimeout(timeoutID);
  observer.disconnect();
  active = false;
  scrollToBottomButton?.classList.remove(activeClass);
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

const addButtonToPage = ([scrollToTopButton]) => {
  if (!scrollToBottomButton) {
    const hiddenClasses = keyToClasses('hidden');

    scrollToBottomButton = scrollToTopButton.cloneNode(true);
    hiddenClasses.forEach(className => scrollToBottomButton.classList.remove(className));
    scrollToBottomButton.removeAttribute('aria-label');
    scrollToBottomButton.style.marginTop = '0.5ch';
    scrollToBottomButton.style.transform = 'rotate(180deg)';
    scrollToBottomButton.addEventListener('click', onClick);
    scrollToBottomButton.id = scrollToBottomButtonId;

    scrollToBottomButton.classList[active ? 'add' : 'remove'](activeClass);
  }

  scrollToTopButton.after(scrollToBottomButton);
  scrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);
  pageModifications.register('*', checkForButtonRemoved);
};

export const main = async () => {
  pageModifications.register(`button[aria-label="${translate('Scroll to top')}"]`, addButtonToPage);
  pageModifications.register(knightRiderLoaderSelector, onLoadersAdded);
};

export const clean = async () => {
  pageModifications.unregister(addButtonToPage);
  pageModifications.unregister(checkForButtonRemoved);
  pageModifications.unregister(onLoadersAdded);
  stopScrolling();
  scrollToBottomButton?.remove();
};
