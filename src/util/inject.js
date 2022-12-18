import { dom } from './dom.js';

const { nonce } = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

/**
 * @param {Function} func - Function to run in the page context (can be async)
 * @param {Array} [args] - Array of arguments to pass to the function via spread
 * @param {Element} [target] - Element to append script to; will be accessible as
 *                             document.currentScript.parentElement in the injected function.
 * @returns {Promise<any>} The return value of the function, or the caught exception
 */
export const inject = async (func, args = [], target = document.documentElement) => {
  const name = `xkit$${func.name || 'injected'}`;
  const async = func instanceof AsyncFunction;

  const script = dom('script', { nonce }, null, [`{
    const scriptElement = document.currentScript;
    const ${name} = ${func.toString()};
    const returnValue = ${name}(...${JSON.stringify(args)});
    ${async
      ? `returnValue
          .then(result => scriptElement.dispatchEvent(
            new CustomEvent('xkitinjection', { detail: { result } })
          ))
          .catch(exception => {
            const e = {
              message: exception.message,
              name: exception.name,
              stack: exception.stack,
              ...exception
            };
            scriptElement.dispatchEvent(
              new CustomEvent('xkitinjection', { detail: { exception: e } })
            );
          });
        `
      : `scriptElement.dispatchEvent(
          new CustomEvent('xkitinjection', { detail: { result: returnValue } })
        );`
    }
  }`]);

  return new Promise((resolve, reject) => {
    script.addEventListener('xkitinjection', ({ detail: { result, exception } }) => {
      if (result) {
        resolve(result);
      } else if (exception) {
        reject(exception);
      }
    }, { once: true });
    target.append(script);
    script.remove();
  });
};
