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

const modalScrollContainerSelector = `${keyToCss('drawerContent')} > ${keyToCss('scrollContainer')}`;

let scrollToBottomButton;
let modalScrollToBottomButton;
let active = false;

let scrollElement;

const styleElement = buildStyle(`
.${buttonClass} {
  margin-top: 0.5ch;
  transform: rotate(180deg);
}

${keyToCss('drawer')} .${buttonClass} {
  margin-top: 1ch;
}

.${activeClass} svg use {
  --icon-color-primary: rgb(var(--yellow));
}
`);

const getScrollElement = () =>
  document.querySelector(modalScrollContainerSelector) ||
  document.documentElement;

const getObserveElement = () =>
  document.querySelector(modalScrollContainerSelector)?.firstElementChild ||
  document.documentElement;

const scrollToBottom = () => {
  scrollElement.scrollTo({ top: scrollElement.scrollHeight });

  const buttonConnected = scrollToBottomButton?.isConnected || modalScrollToBottomButton?.isConnected;
  const loaders = [...scrollElement.querySelectorAll(knightRiderLoaderSelector)];

  if (!buttonConnected || scrollElement !== getScrollElement() || loaders.length === 0) {
    stopScrolling();
  }
};
const observer = new ResizeObserver(scrollToBottom);

const startScrolling = () => {
  scrollElement = getScrollElement();

  observer.observe(getObserveElement());
  active = true;
  scrollToBottomButton?.classList.add(activeClass);
  modalScrollToBottomButton?.classList.add(activeClass);

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

const addButtonToPage = async function ([scrollToTopButton]) {
  if (!scrollToBottomButton) {
    const hiddenClasses = keyToClasses('hidden');

    scrollToBottomButton = scrollToTopButton.cloneNode(true);
    hiddenClasses.forEach(className => scrollToBottomButton.classList.remove(className));
    scrollToBottomButton.removeAttribute('aria-label');
    scrollToBottomButton.addEventListener('click', onClick);
    scrollToBottomButton.classList.add(buttonClass);

    scrollToBottomButton.classList[active ? 'add' : 'remove'](activeClass);
  }

  scrollToTopButton.after(scrollToBottomButton);
  scrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);
};

const addModalButtonToPage = async function ([modalScrollToTopButton]) {
  if (!modalScrollToBottomButton) {
    const hiddenClasses = keyToClasses('hidden');

    modalScrollToBottomButton = modalScrollToTopButton.cloneNode(true);
    hiddenClasses.forEach(className => modalScrollToBottomButton.classList.remove(className));
    modalScrollToBottomButton.removeAttribute('aria-label');
    modalScrollToBottomButton.addEventListener('click', onClick);
    modalScrollToBottomButton.classList.add(buttonClass);

    modalScrollToBottomButton.classList[active ? 'add' : 'remove'](activeClass);
  }

  modalScrollToTopButton.after(modalScrollToBottomButton);
  modalScrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);
};

export const main = async function () {
  pageModifications.register(`button[aria-label="${translate('Scroll to top')}"]`, addButtonToPage);
  pageModifications.register(`button[aria-label="${translate('Back to top')}"]`, addModalButtonToPage);

  document.documentElement.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(addButtonToPage);
  stopScrolling();
  scrollToBottomButton?.remove();
  styleElement.remove();
};
