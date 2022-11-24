import { inject } from '../util/inject.js';
import { getPreferences } from '../util/preferences.js';

let observer;
let mode;

const unburyPollerContext = () => {
  const postElement = document.currentScript.parentElement;
  const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactFiber'));
  let fiber = postElement[reactKey];

  while (fiber) {
    const { pollerContext } = fiber.memoizedProps || {};
    if (pollerContext !== undefined) {
      console.log(fiber);
      return pollerContext;
    } else {
      fiber = fiber.return;
    }
  }
};

const countRegex = /^\(\d+\) /;

const onTitleChanged = async (...args) => {
  console.log('onTitleChanged', args);
  observer?.disconnect();

  const title = document.head.querySelector('title');
  const currentTitle = title.textContent;

  if (mode === 'notifications') {
    const {
      notificationCount = 0,
      unopenedGifts = 0,
      unreadMessagesCount = 0,
      unseenPosts = 0
    } = await inject(unburyPollerContext, [], document.querySelector('header'));

    console.log('pollerContext', {
      notificationCount,
      unopenedGifts,
      unreadMessagesCount,
      unseenPosts
    });

    const count = notificationCount + unopenedGifts + unreadMessagesCount;

    title.textContent = currentTitle.replace(countRegex, count ? `(${count}) ` : '');
  } else {
    title.textContent = currentTitle.replace(countRegex, '');
    console.log('mode none');
  }

  observer?.observe(title, { characterData: true, subtree: true });
  debouncedOnTitleChanged();
};

const debounce = (func, ms) => {
  let timeoutID;
  return (...args) => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => func(...args), ms);
  };
};

const debouncedOnTitleChanged = debounce(onTitleChanged, 35000);

export const main = async () => {
  ({ mode } = await getPreferences('title_counts'));
  observer = new MutationObserver(onTitleChanged);
  onTitleChanged();
};

export const clean = async () => {
  observer.disconnect();
  observer = undefined;
};
