const { nonce } = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

/**
 * @param {Function} func - Function to run in the page context (can be async)
 * @param {Array} args - Array of arguments to pass to the function via spread
 * @returns {Promise<any>} The return value of the function, or the caught exception
 */
export const inject = async (func, args = []) => {
  const script = document.createElement('script');
  const name = `xkit$${func.name || 'injected'}`;
  const async = func instanceof AsyncFunction;

  script.setAttribute('nonce', nonce);
  script.textContent = `{
    const { dataset } = document.currentScript;
    const ${name} = ${func.toString()};
    const returnValue = ${name}(...${JSON.stringify(args)});
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
  }`;

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
      document.documentElement.append(script);
      script.remove();
    });
  } else {
    document.documentElement.appendChild(script);
    script.remove();
    return JSON.parse(script.dataset.result);
  }
};
