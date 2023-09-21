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

    const responseHandler = ({ detail }) => {
      const { id, result, exception } = JSON.parse(detail);
      if (id !== requestId) return;

      target.removeEventListener('xkitinjectionresponse', responseHandler);
      exception ? reject(exception) : resolve(result);
    };
    target.addEventListener('xkitinjectionresponse', responseHandler);

    target.dispatchEvent(
      new CustomEvent('xkitinjectionrequest', { detail: JSON.stringify(data), bubbles: true })
    );
  });
