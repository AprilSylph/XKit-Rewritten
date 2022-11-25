import { inject } from '../util/inject.js';
import { getPreferences } from '../util/preferences.js';

let observer;
let mode;

const unburyPollerContext = () => {
  const postElement = document.currentScript.parentElement;
  const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactFiber'));
  let fiber = postElement[reactKey];

  while (fiber) {
    const { pollerContext } = fiber.stateNode?.props || {};
    if (pollerContext !== undefined) {
      console.log(fiber);
      return pollerContext;
    } else {
      fiber = fiber.return;
    }
  }
};

const countRegex = /^\(\d+\) /;

const updateTitleCount = async (...args) => {
  console.log('onTitleChanged', args);

  let count = 0;

  if (mode === 'notifications') {
    const {
      notificationCount = 0,
      unopenedGifts = 0,
      unreadMessagesCount = 0,
      unseenPosts = 0
    } = document.querySelector('header')
      ? await inject(unburyPollerContext, [], document.querySelector('header'))
      : {};

    console.log('pollerContext', {
      notificationCount,
      unopenedGifts,
      unreadMessagesCount,
      unseenPosts
    });

    count = notificationCount + unopenedGifts + unreadMessagesCount;
  }

  observer?.disconnect();

  const titleElement = document.head.querySelector('title');
  const currentTitle = titleElement.textContent;
  titleElement.textContent = `${count ? `(${count}) ` : ''}${currentTitle.replace(countRegex, '')}`;

  observer?.observe(titleElement, { characterData: true, subtree: true });
  observer?.observe(document.head, { childList: true });
  delayedUpdateTitleCount();
};

let timeoutID;
const delayedUpdateTitleCount = (...args) => {
  clearTimeout(timeoutID);
  timeoutID = setTimeout(() => updateTitleCount(...args), 35000);
};

export const main = async () => {
  ({ mode } = await getPreferences('title_counts'));
  observer = new MutationObserver(updateTitleCount);
  updateTitleCount();
};

export const clean = async () => {
  clearTimeout(timeoutID);
  observer.disconnect();
  observer = undefined;
};
