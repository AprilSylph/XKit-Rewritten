(function() {
  let nonce;

  const inject = (async_func, args) => new Promise((resolve, reject) => {
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
          resolve(result);
        } else {
          reject(Object.assign(new Error(), JSON.parse(exception)));
        }
      }
    };

    const script = document.createElement('script');

    script.setAttribute('nonce', nonce);
    script.textContent = `{
      (${async_func.toString()})(...${JSON.stringify(args)})
      .then(result => window.postMessage({
        xkitCallbackNonce: ${callbackNonce},
        result,
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
