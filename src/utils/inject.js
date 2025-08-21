/**
 * Runs a script in the page's "main" execution environment and returns its result.
 * This permits access to variables exposed by the Tumblr web platform that are normally inaccessible
 * in the content script sandbox.
 * See the src/main_world directory and [../main_world/index.js](../main_world/index.js).
 * @param {string} path - Absolute path of script to inject (will be fed to `runtime.getURL()`)
 * @param {Array} [args] - Array of arguments to pass to the script
 * @param {Element} [target] - Target element; will be accessible as the `this` value in the injected function.
 * @returns {Promise<any>} The transmitted result of the script
 */
export const inject = (path, args = [], target = document.documentElement) =>
  new Promise((resolve, reject) => {
    const requestId = String(Math.random());
    const data = { path: browser.runtime.getURL(path), args, id: requestId };

    const responseHandler = ({ detail }) => {
      const { id, result, exception } = JSON.parse(detail);
      if (id !== requestId) return;

      target.removeEventListener('xkit-injection-response', responseHandler);
      exception ? reject(exception) : resolve(result);
    };
    target.addEventListener('xkit-injection-response', responseHandler);

    target.dispatchEvent(
      new CustomEvent('xkit-injection-request', { detail: JSON.stringify(data), bubbles: true })
    );
  });
