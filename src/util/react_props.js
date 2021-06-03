import { inject } from './inject.js';

const cache = {};

/**
 * @param {string} postID - The post ID of an on-screen post
 * @returns {object} - The post's buried timelineObject property (cached; use
 *  timelineObject if you need up-to-date properties that may have changed)
 */
export const timelineObjectMemoized = async function (postID) {
  if (Object.prototype.hasOwnProperty.call(cache, postID)) {
    return cache[postID];
  }
  return timelineObject(postID);
};

/**
 * @param {string} postID - The post ID of an on-screen post
 * @returns {object} - The post's buried timelineObject property
 */
export const timelineObject = async function (postID) {
  cache[postID] = inject(async id => {
    const postElement = document.querySelector(`[data-id="${id}"]`);
    const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactInternalInstance'));
    let fiber = postElement[reactKey];
    let tries = 0;

    while (fiber.memoizedProps.timelineObject === undefined && tries <= 10) {
      fiber = fiber.return;
      tries++;
    }

    return fiber.memoizedProps.timelineObject;
  }, [postID]);
  return cache[postID];
};

/**
 * Adds data-timeline attributes to all timeline elements on the page, set to the buried endpointApiRequest.givenPath property
 *
 * @returns {null} - Resolves when finished
 */
export const exposeTimelines = async () => inject(async () => {
  const cssMap = await window.tumblr.getCssMap();
  const [timelineClass] = cssMap.timeline;

  [...document.querySelectorAll(`.${timelineClass}:not([data-timeline])`)].forEach(timelineElement => {
    const reactKey = Object.keys(timelineElement).find(key => key.startsWith('__reactInternalInstance'));
    let fiber = timelineElement[reactKey];

    while (fiber.memoizedProps.endpointApiRequest === undefined) {
      fiber = fiber.return;
    }

    if (!fiber) { return; }

    const { givenPath } = fiber.memoizedProps.endpointApiRequest;
    timelineElement.dataset.timeline = givenPath;
  });
});

/**
 * @param {object} postElement - A post's HTMLDivElement
 * @returns {string} That post's buried endpointApiRequest.givenPath property
 */
export const givenPath = async function (postElement) {
  if (postElement.parentNode.dataset.timeline !== undefined) {
    return postElement.parentNode.dataset.timeline;
  }

  const xkitTempId = `${new Date().getTime()}${Math.random()}`;
  Object.assign(postElement.dataset, { xkitTempId });

  return inject(async tempId => {
    const localPostElement = document.querySelector(`[data-xkit-temp-id="${tempId}"]`);
    delete localPostElement.dataset.xkitTempId;

    const reactKey = Object.keys(localPostElement).find(key => key.startsWith('__reactInternalInstance'));
    let fiber = localPostElement[reactKey];
    let tries = 0;

    while (fiber.memoizedProps.endpointApiRequest === undefined && tries <= 20) {
      fiber = fiber.return;
      tries++;
    }

    const { givenPath } = fiber.memoizedProps.endpointApiRequest;

    localPostElement.parentNode.dataset.timeline = givenPath;
    return givenPath;
  }, [xkitTempId]);
};
