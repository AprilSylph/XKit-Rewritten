import { dom } from './dom.js';

const { nonce } = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));

/**
 * @param {string} path - Absolute path of script to inject (will be fed to `runtime.getURL()`)
 * @param {Array} [args] - Array of arguments to pass to the script
 * @param {Element} [target] - Element to append the `<script>` to; will be accessible as
 *                             `document.currentScript.parentElement` in the injected script
 * @returns {Promise<any>} The transmitted result of the script
 */
export const inject = async (path, args = [], target = document.documentElement) => {
  const script = dom('script', {
    'data-arguments': JSON.stringify(args),
    nonce,
    src: browser.runtime.getURL(path)
  });

  return new Promise((resolve, reject) => {
    const attributeObserver = new MutationObserver((mutations, observer) => {
      if (mutations.some(({ attributeName }) => attributeName === 'data-result')) {
        observer.disconnect();
        resolve(JSON.parse(script.dataset.result));
        script.remove();
      } else if (mutations.some(({ attributeName }) => attributeName === 'data-exception')) {
        observer.disconnect();
        reject(JSON.parse(script.dataset.exception));
        script.remove();
      }
    });

    attributeObserver.observe(script, {
      attributes: true,
      attributeFilter: ['data-result', 'data-exception']
    });
    target.append(script);
  });
};
