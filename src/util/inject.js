const { nonce } = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));

const callbacks = new Map();

window.addEventListener(
  'message',
  function messageHandler ({ origin, data: { result, exception, xkitCallbackNonce } }) {
    if (origin === location.origin && callbacks.has(xkitCallbackNonce)) {
      const [resolve, reject] = callbacks.get(xkitCallbackNonce);
      callbacks.delete(xkitCallbackNonce);

      if (exception === undefined) {
        resolve(JSON.parse(result || 'null'));
      } else {
        reject(Object.assign(new Error(), JSON.parse(exception)));
      }
    }
  }
);

/**
 * @param {Function} asyncFunc - Asynchronous function to run in the page context
 * @param {Array} args - Array of arguments to pass to the function via spread
 * @returns {Promise<any>} The return value of the async function, or the caught exception
 */
export const inject = (asyncFunc, args = []) => new Promise((resolve, reject) => {
  const callbackNonce = Math.random();
  callbacks.set(callbackNonce, [resolve, reject]);

  const script = document.createElement('script');

  script.setAttribute('nonce', nonce);
  script.textContent = `{
    (${asyncFunc.toString()})(...${JSON.stringify(args)})
    .then(result => window.postMessage({
      xkitCallbackNonce: ${callbackNonce},
      result: JSON.stringify(result),
    }, '${location.origin}'))
    .catch(exception => window.postMessage({
      xkitCallbackNonce: ${callbackNonce},
      exception: JSON.stringify(Object.assign({}, exception, {
        message: exception.message,
        stack: exception.stack,
      })),
    }, '${location.origin}'))
  }`;

  document.documentElement.appendChild(script);
  script.remove();
});
