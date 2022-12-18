export const getCssMap = async () => window.tumblr.getCssMap();
export const getLanguageData = () => window.tumblr.languageData;

export const unburyTimelineObject = (element) => {
  const postElement = document.currentScript?.parentElement ?? element;

  const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactFiber'));
  let fiber = postElement[reactKey];

  while (fiber !== null) {
    const { timelineObject } = fiber.memoizedProps || {};
    if (timelineObject !== undefined) {
      return timelineObject;
    } else {
      fiber = fiber.return;
    }
  }
};

export const unburyTargetPostIds = async (notificationSelector) => {
  [...document.querySelectorAll(notificationSelector)]
    .forEach(notificationElement => {
      const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
      let fiber = notificationElement[reactKey];

      while (fiber !== null) {
        const { notification } = fiber.memoizedProps || {};
        if (notification !== undefined) {
          const { targetRootPostId, targetPostId } = notification;
          notificationElement.dataset.targetRootPostId = targetRootPostId || targetPostId;
          break;
        } else {
          fiber = fiber.return;
        }
      }
    });
};

export const getNotificationProps = function (element) {
  const notificationElement = document.currentScript?.parentElement ?? element;
  const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
  let fiber = notificationElement[reactKey];

  while (fiber !== null) {
    const { notification } = fiber.memoizedProps || {};
    if (notification !== undefined) {
      return notification;
    } else {
      fiber = fiber.return;
    }
  }
};

export const testHeaderElement = (selector, element) => {
  const menuElement = document.currentScript?.parentElement ?? element;
  const reactKey = Object.keys(menuElement).find(key => key.startsWith('__reactFiber'));
  let fiber = menuElement[reactKey];

  while (fiber !== null) {
    if (fiber.elementType === 'header') {
      return fiber.stateNode.matches(selector);
    } else {
      fiber = fiber.return;
    }
  }
};

export const controlTagsInput = async ({ add, remove }) => {
  add = add.map(tag => tag.trim()).filter((tag, index, array) => array.indexOf(tag) === index);

  const selectedTagsElement = document.getElementById('selected-tags');
  if (!selectedTagsElement) { return; }

  const reactKey = Object.keys(selectedTagsElement).find(key => key.startsWith('__reactFiber'));
  let fiber = selectedTagsElement[reactKey];

  while (fiber !== null) {
    let tags = fiber.stateNode?.state?.tags;
    if (Array.isArray(tags)) {
      tags.push(...add.filter(tag => tags.includes(tag) === false));
      tags = tags.filter(tag => remove.includes(tag) === false);
      fiber.stateNode.setState({ tags });
      break;
    } else {
      fiber = fiber.return;
    }
  }
};

export const doApiFetch = async (resource, init = {}) => {
  // add XKit header to all API requests
  init.headers ??= {};
  init.headers['X-XKit'] = '1';

  // convert all keys in the body to snake_case
  if (init.body !== undefined) {
    const objects = [init.body];

    while (objects.length !== 0) {
      const currentObjects = objects.splice(0);

      currentObjects.forEach(obj => {
        Object.keys(obj).forEach(key => {
          const snakeCaseKey = key
            .replace(/^[A-Z]/, match => match.toLowerCase())
            .replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);

          if (snakeCaseKey !== key) {
            obj[snakeCaseKey] = obj[key];
            delete obj[key];
          }
        });
      });

      objects.push(
        ...currentObjects
          .flatMap(Object.values)
          .filter(value => value instanceof Object)
      );
    }
  }

  return window.tumblr.apiFetch(resource, init);
};

export const doPostForm = async (resource, body) => fetch(resource, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
  body
});
