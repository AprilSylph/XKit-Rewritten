import { keyToClasses, keyToCss } from '../util/css_map.js';
import { translate } from '../util/language_data.js';
import { pageModifications } from '../util/mutations.js';
import { buildStyle } from '../util/interface.js';

const scrollToBottomButtonId = 'xkit-scroll-to-bottom-button';
$(`[id="${scrollToBottomButtonId}"]`).remove();

const knightRiderLoaderSelector = `main ${keyToCss('loader')} ${keyToCss('knightRiderLoader')}`;

let scrollToBottomButton;
let scrollToBottomIcon;
let active = false;

const styleElement = buildStyle(`
${keyToCss('isPeeprShowing')} #${scrollToBottomButtonId} {
  opacity: 0;
  pointer-events: none;
}
`);

const scrollToBottom = () => {
  window.scrollTo({ top: document.documentElement.scrollHeight });
  if (document.querySelector(knightRiderLoaderSelector) === null) {
    stopScrolling();
  }
};
const observer = new ResizeObserver(scrollToBottom);

const startScrolling = () => {
  observer.observe(document.documentElement);
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
    const hiddenClasses = keyToClasses('hidden');

    scrollToBottomButton = scrollToTopButton.cloneNode(true);
    hiddenClasses.forEach(className => scrollToBottomButton.classList.remove(className));
    scrollToBottomButton.removeAttribute('aria-label');
    scrollToBottomButton.style.marginTop = '0.5ch';
    scrollToBottomButton.style.transform = 'rotate(180deg)';
    scrollToBottomButton.addEventListener('click', onClick);
    scrollToBottomButton.id = scrollToBottomButtonId;

    scrollToBottomIcon = scrollToBottomButton.querySelector('svg');
    scrollToBottomIcon.style.fill = active ? 'rgb(var(--yellow))' : '';
  }

  scrollToTopButton.after(scrollToBottomButton);
  scrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);
  pageModifications.register('*', checkForButtonRemoved);
};

export const main = async function () {
  pageModifications.register(`button[aria-label="${translate('Scroll to top')}"]`, addButtonToPage);
  document.head.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(addButtonToPage);
  pageModifications.unregister(checkForButtonRemoved);
  stopScrolling();
  scrollToBottomButton?.remove();
  styleElement.remove();
};
