import { keyToClasses, keyToCss } from '../../utils/css_map.js';
import { translate } from '../../utils/language_data.js';
import { pageModifications } from '../../utils/mutations.js';
import { buildStyle, waitForScroller } from '../../utils/interface.js';
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

    scrollToBottomButton.classList[active ? 'add' : 'remove'](activeClass);
  }

  scrollToTopButton.after(scrollToBottomButton);
  scrollToTopButton.addEventListener('click', stopScrolling);
  document.documentElement.addEventListener('keydown', onKeyDown);
  pageModifications.register('*', checkForButtonRemoved);
};

const caughtUpCarouselObjectType = 'followed_tag_carousel_card';

const scrollToCaughtUp = async (addedCells) => {
  const isStarting = !active;
  for (const cell of isStarting ? [...document.querySelectorAll(keyToCss('cell'))] : addedCells) {
    const item = await cellItem(cell);
    if (item.elements?.some(({ objectType }) => objectType === caughtUpCarouselObjectType)) {
      if (!isStarting) stopScrolling();
      if (!isStarting) await waitForScroller();

      const titleElement = cell?.previousElementSibling;
      const titleElementTop = titleElement?.getBoundingClientRect?.()?.top;
      if (!titleElementTop) continue;

      const isAboveViewportBottom = titleElementTop < window.innerHeight;
      if (isStarting && isAboveViewportBottom) continue;

      window.scrollBy({ top: titleElementTop });
      console.log(
        isStarting
          ? 'Scroll to Bottom scrolled down to existing carousel:'
          : 'Scroll to Bottom scrolled to newly added carousel:',
        titleElement
      );
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
