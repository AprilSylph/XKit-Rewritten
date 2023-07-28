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

const cloneButton = target => {
  const clonedButton = target.cloneNode(true);
  keyToClasses('hidden').forEach(className => clonedButton.classList.remove(className));
  clonedButton.removeAttribute('aria-label');
  clonedButton.addEventListener('click', onClick);
  clonedButton.classList.add(buttonClass);

  clonedButton.classList[active ? 'add' : 'remove'](activeClass);
  return clonedButton;
};

const addButtonToPage = async function ([scrollToTopButton]) {
  scrollToBottomButton ??= cloneButton(scrollToTopButton);

  scrollToTopButton.after(scrollToBottomButton);
  scrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);
};

const modalButtonColorObserver = new MutationObserver(([mutation]) => {
  modalScrollToBottomButton.style = mutation.target.style.cssText;
});

const addModalButtonToPage = async function ([modalScrollToTopButton]) {
  modalScrollToBottomButton ??= cloneButton(modalScrollToTopButton);

  modalScrollToTopButton.after(modalScrollToBottomButton);
  modalScrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);

  modalButtonColorObserver.observe(modalScrollToTopButton, { attributeFilter: ['style'] });
};

export const main = async function () {
  pageModifications.register(`button[aria-label="${translate('Scroll to top')}"]`, addButtonToPage);
  pageModifications.register(`button[aria-label="${translate('Back to top')}"]`, addModalButtonToPage);

  document.documentElement.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(addButtonToPage);
  modalButtonColorObserver.disconnect();
  stopScrolling();
  scrollToBottomButton?.remove();
  styleElement.remove();
};
