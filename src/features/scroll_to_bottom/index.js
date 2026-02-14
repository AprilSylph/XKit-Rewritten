import { keyToClasses, keyToCss } from '../../utils/css_map.js';
import { debounce } from '../../utils/debounce.js';
import { buildStyle, displayBlockUnlessDisabledAttr } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';
import { cellItem } from '../../utils/react_props.js';

const scrollToBottomButtonId = 'xkit-scroll-to-bottom-button';
$(`[id="${scrollToBottomButtonId}"]`).remove();
const activeClass = 'xkit-scroll-to-bottom-active';

const loaderSelector = `
${keyToCss('timeline', 'blogRows')} > :is(${keyToCss('scrollContainer')}, .sortableContainer) + div,
${keyToCss('notifications')} + div
`;
const knightRiderLoaderSelector = `:is(${loaderSelector}) > ${keyToCss('knightRiderLoader')}`;

let stopAtCaughtUp;
let scrollToBottomButton;
let active = false;

export const styleElement = buildStyle(`
.${activeClass} svg use {
  --icon-color-primary: rgb(var(--yellow));
}
`);

let timeoutID;

const onLoadersAdded = () => {
  if (active) {
    clearTimeout(timeoutID);
  }
};

const scrollToBottom = () => {
  clearTimeout(timeoutID);
  requestAnimationFrame(() => window.scrollTo({ top: document.documentElement.scrollHeight }));

  timeoutID = setTimeout(() => {
    if (!document.querySelector(knightRiderLoaderSelector)) {
      stopScrolling();
    }
  }, 500);
};
const observer = new ResizeObserver(scrollToBottom);

const startScrolling = async () => {
  if (stopAtCaughtUp && await scrollToCaughtUp()) return;

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

const onclick = () => active ? stopScrolling() : startScrolling();
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
    scrollToBottomButton.addEventListener('click', onclick);
    scrollToBottomButton.id = scrollToBottomButtonId;
    scrollToBottomButton.setAttribute(displayBlockUnlessDisabledAttr, '');

    scrollToBottomButton.classList.toggle(activeClass, active);
  }

  scrollToTopButton.after(scrollToBottomButton);
  scrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);
  pageModifications.register('*', checkForButtonRemoved);
};

const reliablyScrollToTarget = target => {
  const callback = () => {
    window.scrollBy({ top: target?.getBoundingClientRect?.()?.top });
    debouncedDisconnect();
  };
  const observer = new ResizeObserver(callback);
  const debouncedDisconnect = debounce(() => observer.disconnect(), 500);
  observer.observe(document.documentElement);
  callback();
};

const caughtUpCarouselObjectType = 'followed_tag_carousel_card';

const scrollToCaughtUp = async (addedCells) => {
  for (const cell of addedCells || [...document.querySelectorAll(keyToCss('cell'))]) {
    const item = await cellItem(cell);
    if (item.elements?.some(({ objectType }) => objectType === caughtUpCarouselObjectType)) {
      const titleElement = cell?.previousElementSibling;
      if (!titleElement) continue;

      if (active) {
        stopScrolling();
      } else {
        const titleElementTop = titleElement?.getBoundingClientRect?.()?.top;
        const isAboveViewportBottom = titleElementTop !== undefined && titleElementTop < window.innerHeight;
        if (isAboveViewportBottom) continue;
      }

      reliablyScrollToTarget(titleElement);
      return true;
    }
  }
};

const onCellsAdded = addedCells => active && scrollToCaughtUp(addedCells);

export const main = async function () {
  ({ stopAtCaughtUp } = await getPreferences('scroll_to_bottom'));

  pageModifications.register(`button[aria-label="${translate('Scroll to top')}"]`, addButtonToPage);
  pageModifications.register(knightRiderLoaderSelector, onLoadersAdded);
  stopAtCaughtUp && pageModifications.register(keyToCss(('cell')), onCellsAdded);
};

export const clean = async function () {
  pageModifications.unregister(addButtonToPage);
  pageModifications.unregister(checkForButtonRemoved);
  pageModifications.unregister(onLoadersAdded);
  pageModifications.unregister(onCellsAdded);

  stopScrolling();
  scrollToBottomButton?.remove();
};
