import { getRandomHexString } from './crypto.js';

const { nonce } = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));
const injectKey = getRandomHexString();
const callbacks = new Map();

let messagePort;

const messageHandler = function ({ data: { result, exception, xkitCallbackId } }) {
  if (callbacks.has(xkitCallbackId)) {
    const [resolve, reject] = callbacks.get(xkitCallbackId);
    callbacks.delete(xkitCallbackId);

    if (exception === undefined) {
      resolve(JSON.parse(result || 'null'));
    } else {
      reject(Object.assign(new Error(), JSON.parse(exception)));
    }
  }
};

const init = new Promise(resolve => {
  const receivePort = function ({ origin, data, ports: [receivedPort] }) {
    if (origin === location.origin && data === injectKey) {
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
    Object.defineProperty(window, 'xkit$${injectKey}', {
      value: { messagePort: channel.port1 },
      writable: false,
      enumerable: false,
      configurable: false
    });
    window.postMessage(
      '${injectKey}',
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
  const callbackId = Math.random();
  callbacks.set(callbackId, [resolve, reject]);

  const script = document.createElement('script');
  const name = `xkit$${asyncFunc.name || 'injected'}`;

  script.setAttribute('nonce', nonce);
  script.textContent = `{
    const ${name} = ${asyncFunc.toString()};
    ${name}(...${JSON.stringify(args)})
    .then(result => window.xkit$${injectKey}.messagePort.postMessage({
      xkitCallbackId: ${callbackId},
      result: JSON.stringify(result),
    }))
    .catch(exception => window.xkit$${injectKey}.messagePort.postMessage({
      xkitCallbackId: ${callbackId},
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
