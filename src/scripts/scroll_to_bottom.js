import { keyToClasses, keyToCss } from '../util/css_map.js';
import { translate } from '../util/language_data.js';
import { pageModifications } from '../util/mutations.js';
import { buildStyle } from '../util/interface.js';

const buttonClass = 'xkit-scroll-to-bottom-button';
$(`.${buttonClass}`).remove();
const activeClass = 'xkit-scroll-to-bottom-active';

const loaderSelector = `
${keyToCss('timeline', 'blogRows')} > ${keyToCss('loader')},
${keyToCss('notifications')} + ${keyToCss('loader')}
`;
const knightRiderLoaderSelector = `:is(${loaderSelector}) > ${keyToCss('knightRiderLoader')}`;

let scrollToBottomButton;
let modalScrollToBottomButton;
let active = false;

let scrollElement;

const styleElement = buildStyle(`
.${activeClass} svg use {
  --icon-color-primary: rgb(var(--yellow));
}
`);

const scrollToBottom = () => {
  scrollElement.scrollTo({ top: scrollElement.scrollHeight });
  const loaders = [...scrollElement.querySelectorAll(knightRiderLoaderSelector)];

  if (loaders.length === 0) {
    stopScrolling();
  }
};
const observer = new ResizeObserver(scrollToBottom);

const startScrolling = () => {
  const modalScrollContainer = document.querySelector(`${keyToCss('drawerContent')} > ${keyToCss('scrollContainer')}`);

  scrollElement = modalScrollContainer || document.documentElement;
  observer.observe(modalScrollContainer?.firstElementChild || document.documentElement);
  active = true;
  scrollToBottomButton.classList.add(activeClass);
  modalScrollToBottomButton.classList.add(activeClass);
  scrollToBottom();
};

const stopScrolling = () => {
  observer.disconnect();
  active = false;
  scrollToBottomButton?.classList.remove(activeClass);
  modalScrollToBottomButton?.classList.remove(activeClass);
};

const onClick = () => active ? stopScrolling() : startScrolling();
const onKeyDown = ({ key }) => key === '.' && stopScrolling();

// const checkForButtonRemoved = () => {
//   const buttonWasRemoved = document.documentElement.contains(scrollToBottomButton) === false;
//   if (buttonWasRemoved) {
//     if (active) stopScrolling();
//     pageModifications.unregister(checkForButtonRemoved);
//   }
// };

const addButtonToPage = async function ([scrollToTopButton]) {
  if (!scrollToBottomButton) {
    const hiddenClasses = keyToClasses('hidden');

    scrollToBottomButton = scrollToTopButton.cloneNode(true);
    hiddenClasses.forEach(className => scrollToBottomButton.classList.remove(className));
    scrollToBottomButton.removeAttribute('aria-label');
    scrollToBottomButton.style.marginTop = '0.5ch';
    scrollToBottomButton.style.transform = 'rotate(180deg)';
    scrollToBottomButton.addEventListener('click', onClick);
    scrollToBottomButton.classList.add(buttonClass);

    scrollToBottomButton.classList[active ? 'add' : 'remove'](activeClass);
  }

  scrollToTopButton.after(scrollToBottomButton);
  scrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);
  // pageModifications.register('*', checkForButtonRemoved);
};

const addModalButtonToPage = async function ([modalScrollToTopButton]) {
  if (!modalScrollToBottomButton) {
    const hiddenClasses = keyToClasses('hidden');

    modalScrollToBottomButton = modalScrollToTopButton.cloneNode(true);
    hiddenClasses.forEach(className => modalScrollToBottomButton.classList.remove(className));
    modalScrollToBottomButton.removeAttribute('aria-label');
    modalScrollToBottomButton.style.marginTop = '1ch';
    modalScrollToBottomButton.style.transform = 'rotate(180deg)';
    modalScrollToBottomButton.addEventListener('click', onClick);
    modalScrollToBottomButton.classList.add(buttonClass);

    modalScrollToBottomButton.classList[active ? 'add' : 'remove'](activeClass);
  }

  modalScrollToTopButton.after(modalScrollToBottomButton);
  modalScrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);
  // pageModifications.register('*', checkForButtonRemoved);
};

export const main = async function () {
  pageModifications.register(`button[aria-label="${translate('Scroll to top')}"]`, addButtonToPage);
  pageModifications.register(`button[aria-label="${translate('Back to top')}"]`, addModalButtonToPage);

  document.documentElement.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(addButtonToPage);
  // pageModifications.unregister(checkForButtonRemoved);
  stopScrolling();
  scrollToBottomButton?.remove();
  styleElement.remove();
};
