let nonce;
const pending = new Map();

const callback = event => {
  const { result, exception, xkitCallbackNonce } = event.data;

  if (event.origin === `${location.protocol}//${location.host}` && pending.has(xkitCallbackNonce)) {
    const [resolve, reject] = pending.get(xkitCallbackNonce);
    pending.delete(xkitCallbackNonce);
    if (pending.size === 0) {
      window.removeEventListener('message', callback);
    }

    if (exception === undefined) {
      resolve(JSON.parse(result || 'null'));
    } else {
      reject(Object.assign(new Error(), JSON.parse(exception)));
    }
  }
};

/**
 * @param {Function} asyncFunc - Asynchronous function to run in the page context
 * @param {Array} args - Array of arguments to pass to the function via spread
 * @returns {Promise<any>} The return value of the async function, or the caught exception
 */
export const inject = (asyncFunc, args = []) => new Promise((resolve, reject) => {
  if (!nonce) {
    const scriptWithNonce = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));
    nonce = scriptWithNonce.nonce || scriptWithNonce.getAttribute('nonce');
  }

  if (pending.size === 0) {
    window.addEventListener('message', callback);
  }
  const callbackNonce = Math.random();
  pending.set(callbackNonce, [resolve, reject]);

  const script = document.createElement('script');

  script.setAttribute('nonce', nonce);
  script.textContent = `{
    (${asyncFunc.toString()})(...${JSON.stringify(args)})
    .then(result => window.postMessage({
      xkitCallbackNonce: ${callbackNonce},
      result: JSON.stringify(result),
    }, '${location.protocol}//${location.host}'))
    .catch(exception => window.postMessage({
      xkitCallbackNonce: ${callbackNonce},
      exception: JSON.stringify(Object.assign({}, exception, {
        message: exception.message,
        stack: exception.stack,
      })),
    }, '${location.protocol}//${location.host}'))
  }`;

  document.documentElement.appendChild(script);
  script.remove();
});
