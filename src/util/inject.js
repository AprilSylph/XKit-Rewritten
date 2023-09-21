/**
 * Apparently required in Firefox to prevent "Permission denied to access property" error when sending an
 * object cross-world.
 * @see https://stackoverflow.com/a/46081249
 */
/* globals cloneInto */
const clone = data => typeof cloneInto !== 'undefined' ? cloneInto(data, document.defaultView) : data;

/**
 * @param {string} name - Function name to run in the page context; must be in injectables.js
 * @param {Array} [args] - Array of arguments to pass to the function via spread
 * @param {Element} [target] - Target element; will be accessible as the last argument to the
 *                             injected function.
 * @returns {Promise<any>} The return value of the function, or the caught exception
 */
export const inject = (name, args = [], target = document.documentElement) =>
  new Promise((resolve, reject) => {
    const requestId = String(Math.random());
    const data = { name, args, id: requestId };

    const responseHandler = ({ detail: { id, result, exception } }) => {
      if (id !== requestId) return;

      target.removeEventListener('xkitinjectionresponse', responseHandler);
      exception ? reject(exception) : resolve(result);
    };
    target.addEventListener('xkitinjectionresponse', responseHandler);

    target.dispatchEvent(
      new CustomEvent('xkitinjectionrequest', { detail: clone(data), bubbles: true })
    );
  });
