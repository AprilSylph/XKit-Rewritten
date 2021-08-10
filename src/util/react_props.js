import { inject } from './inject.js';

const cache = {};

/**
 * @param {string} postID - The post ID of an on-screen post
 * @returns {Promise<object>} - The post's buried timelineObject property (cached; use
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
 * @returns {Promise<object>} - The post's buried timelineObject property
 */
export const timelineObject = async function (postID) {
  cache[postID] = inject(async id => {
    const postElement = document.querySelector(`[tabindex="-1"][data-id="${id}"]`);
    const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactInternalInstance'));
    let fiber = postElement[reactKey];

    while (fiber !== null) {
      const { timelineObject } = fiber.memoizedProps || {};
      if (timelineObject !== undefined) {
        return timelineObject;
      } else {
        fiber = fiber.return;
      }
    }
  }, [postID]);
  return cache[postID];
};

/**
 * Adds data-timeline attributes to all timeline elements on the page, set to the buried endpointApiRequest.givenPath property
 *
 * @returns {Promise<void>} Resolves when finished
 */
export const exposeTimelines = async () => inject(async () => {
  const cssMap = await window.tumblr.getCssMap();
  const [timelineClass] = cssMap.timeline;

  [...document.querySelectorAll(`.${timelineClass}:not([data-timeline])`)].forEach(timelineElement => {
    const reactKey = Object.keys(timelineElement).find(key => key.startsWith('__reactInternalInstance'));
    let fiber = timelineElement[reactKey];

    while (fiber !== null) {
      const { endpointApiRequest } = fiber.memoizedProps || {};
      if (endpointApiRequest !== undefined) {
        timelineElement.dataset.timeline = endpointApiRequest.givenPath;
        break;
      } else {
        fiber = fiber.return;
      }
    }
  });
});

/**
 * Manipulate post form tags
 *
 * @param {Function} transformer - Function to feed post tags array to; expects String[], must return String[]
 * @returns {Promise<void>} Resolves when finished
 */
export const editTags = async transformer => inject(async transformer => {
  const selectedTagsElement = document.getElementById('selected-tags');
  if (!selectedTagsElement) { return; }

  const reactKey = Object.keys(selectedTagsElement).find(key => key.startsWith('__reactInternalInstance'));
  let fiber = selectedTagsElement[reactKey];

  while (fiber !== null) {
    const tags = fiber.stateNode?.state?.tags;
    if (Array.isArray(tags)) {
      fiber.stateNode.setState({ tags: transformer(tags) });
      break;
    } else {
      fiber = fiber.return;
    }
  }
}, [transformer]);
