'use strict';

{
  const getCssMap = async () => window.tumblr.getCssMap();
  const getLanguageData = () => window.tumblr.languageData;

  const unburyTimelineObject = (element) => {
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

  const unburyTargetPostIds = async (notificationSelector) => {
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

  const getNotificationProps = function (element) {
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

  const testHeaderElement = (selector, element) => {
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

  const controlTagsInput = async ({ add, remove }) => {
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

  const doApiFetch = async (resource, init = {}) => {
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

  const doPostForm = async (resource, body) => fetch(resource, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body
  });

  const injectables = {
    getCssMap,
    getLanguageData,
    unburyTimelineObject,
    unburyTargetPostIds,
    getNotificationProps,
    testHeaderElement,
    controlTagsInput,
    doApiFetch,
    doPostForm
  };

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

  const observer = new MutationObserver(mutations => {
    const injectionScriptElements = mutations
      .flatMap(({ addedNodes }) => [...addedNodes])
      .filter(
        addedNode =>
          addedNode instanceof Element &&
          addedNode.nodeName === 'SCRIPT' &&
          addedNode.classList.contains('xkit-injection')
      );
    injectionScriptElements.length && console.log('got injectionScriptElements', injectionScriptElements);

    injectionScriptElements.forEach((scriptElement) => {
      const { dataset } = scriptElement;
      const { name, args } = JSON.parse(dataset.data);

      const fallback = async () => new Error(`function ${name} is not implemented in injected.js`);
      const func = injectables[name] ?? fallback;
      const async = func instanceof AsyncFunction;

      const returnValue = func(...args, scriptElement.parentElement);

      if (async) {
        returnValue
          .then(result => {
            dataset.result = JSON.stringify(result || null);
          })
          .catch(exception => {
            dataset.exception = JSON.stringify({
              message: exception.message,
              name: exception.name,
              stack: exception.stack,
              ...exception
            });
          });
      } else {
        dataset.result = JSON.stringify(returnValue || null);
      }
      scriptElement.remove();
    });
  });

  observer.observe(document, {
    childList: true,
    subtree: true
  });
}
