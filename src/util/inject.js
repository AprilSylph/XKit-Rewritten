const { nonce } = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));

const typedArray = new Uint8Array(8);
window.crypto.getRandomValues(typedArray);
const initNonce = [...typedArray].map(number => number.toString(16).padStart(2, '0')).join('');

const callbacks = new Map();

let messagePort;

const messageHandler = function ({ data: { result, exception, xkitCallbackNonce } }) {
  if (callbacks.has(xkitCallbackNonce)) {
    const [resolve, reject] = callbacks.get(xkitCallbackNonce);
    callbacks.delete(xkitCallbackNonce);

    if (exception === undefined) {
      resolve(JSON.parse(result || 'null'));
    } else {
      reject(Object.assign(new Error(), JSON.parse(exception)));
    }
  }
};

const init = new Promise(resolve => {
  const receivePort = function ({ origin, data: { init }, ports: [receivedPort] }) {
    if (origin === location.origin && init === initNonce) {
      window.removeEventListener('message', receivePort);
      messagePort = receivedPort;
      messagePort.addEventListener('message', messageHandler);
      messagePort.start();
      resolve();
    }
  };
  window.addEventListener('message', receivePort);

  const initScript = document.createElement('script');
  initScript.setAttribute('nonce', nonce);
  initScript.textContent = `{
    const channel = new MessageChannel();
    Object.defineProperty(window, 'xkit$${initNonce}', {
      value: { messagePort: channel.port1 },
      writable: false,
      enumerable: false,
      configurable: false
    });
    window.postMessage(
      { init: '${initNonce}' },
      '${location.origin}',
      [channel.port2]
    );
  }`;

  document.documentElement.appendChild(initScript);
  initScript.remove();
});

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
    .then(result => window.xkit$${initNonce}.messagePort.postMessage({
      xkitCallbackNonce: ${callbackNonce},
      result: JSON.stringify(result),
    }))
    .catch(exception => window.xkit$${initNonce}.messagePort.postMessage({
      xkitCallbackNonce: ${callbackNonce},
      exception: JSON.stringify(Object.assign({}, exception, {
        message: exception.message,
        stack: exception.stack,
      })),
    }))
  }`;

  init.then(() => {
    document.documentElement.appendChild(script);
    script.remove();
  });
});
