import { manifestVersion } from '../manifest_version.js';
import { dom } from './dom.js';

const { nonce } = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const injectMV2 = async (func, args = [], target = document.documentElement) => {
  const name = `xkit$${func.name || 'injected'}`;
  const async = func instanceof AsyncFunction;

  const script = dom('script', { nonce }, null, [`{
    const { dataset } = document.currentScript;
    const ${name} = ${func.toString()};
    const element = document.currentScript.parentElement;
    const returnValue = ${name}(...${JSON.stringify(args)}, element);
    ${async
      ? `returnValue
          .then(result => { dataset.result = JSON.stringify(result || null); })
          .catch(exception => { dataset.exception = JSON.stringify({
            message: exception.message,
            name: exception.name,
            stack: exception.stack,
            ...exception
          })})
        `
      : 'dataset.result = JSON.stringify(returnValue || null);'
    }
  }`]);

  if (async) {
    return new Promise((resolve, reject) => {
      const attributeObserver = new MutationObserver((mutations, observer) => {
        if (mutations.some(({ attributeName }) => attributeName === 'data-result')) {
          observer.disconnect();
          resolve(JSON.parse(script.dataset.result));
        } else if (mutations.some(({ attributeName }) => attributeName === 'data-exception')) {
          observer.disconnect();
          reject(JSON.parse(script.dataset.exception));
        }
      });

      attributeObserver.observe(script, {
        attributes: true,
        attributeFilter: ['data-result', 'data-exception']
      });
      target.append(script);
      script.remove();
    });
  } else {
    target.append(script);
    script.remove();
    return JSON.parse(script.dataset.result);
  }
};

const injectMV3 = (func, args = [], target = document.documentElement) =>
  new Promise((resolve, reject) => {
    const requestId = String(Math.random());
    const data = { name: func.name, args, id: requestId };

    const responseHandler = ({ detail: { id, result, exception } }) => {
      if (id !== requestId) return;

      target.removeEventListener('xkitinjectionresponse', responseHandler);
      exception ? reject(exception) : resolve(result);
    };
    target.addEventListener('xkitinjectionresponse', responseHandler);

    target.dispatchEvent(
      new CustomEvent('xkitinjectionrequest', { detail: data, bubbles: true })
    );
  });

/**
 * @param {Function} func - Function to run in the page context (can be async). Must
 *                          be in injectable_functions.js for MV3 compatibility.
 * @param {Array} [args] - Array of arguments to pass to the function via spread
 * @param {Element} [target] - Element to append script to; will be accessible as
 *                             document.currentScript.parentElement or as the last
 *                             argument in the injected function.
 * @returns {Promise<any>} The return value of the function, or the caught exception
 */
export const inject = manifestVersion === 3 ? injectMV3 : injectMV2;
