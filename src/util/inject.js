(function () {
  let nonce;

  /**
   * @param {Function} asyncFunc - Asynchronous function to run in the page context
   * @param {object[]} args - Array of arguments to pass to the function via spread
   * @returns {Promise} - A promise which resolves to the return value of the async function, or rejects with the caught exception
   */
  const inject = (asyncFunc, args = []) => new Promise((resolve, reject) => {
    if (!nonce) {
      const scriptWithNonce = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));
      nonce = scriptWithNonce.nonce || scriptWithNonce.getAttribute('nonce');
    }

    const callbackNonce = Math.random();

    const callback = event => {
      if (event.origin === `${location.protocol}//${location.host}` && event.data.xkitCallbackNonce === callbackNonce) {
        window.removeEventListener('message', callback);

        const { result, exception } = event.data;

        if (exception === undefined) {
          resolve(JSON.parse(result));
        } else {
          reject(Object.assign(new Error(), JSON.parse(exception)));
        }
      }
    };

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

    window.addEventListener('message', callback);
    document.documentElement.appendChild(script);
    document.documentElement.removeChild(script);
  });

  return { inject };
})();
