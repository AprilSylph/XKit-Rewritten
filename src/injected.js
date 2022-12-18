'use strict';

import('./injectable_functions.js').then(injectableFunctions =>
  document.documentElement.addEventListener('xkitinjectionrequest', async event => {
    const { detail: { id, name, args }, target } = event;

    const fallback = async () => new Error(`function "${name}" is not implemented in injectable_functions.js`);
    const func = injectableFunctions[name] ?? fallback;

    try {
      const result = await func(...args, target);
      target.dispatchEvent(
        new CustomEvent('xkitinjectionresponse', { detail: { id, result } })
      );
    } catch (exception) {
      target.dispatchEvent(
        new CustomEvent('xkitinjectionresponse', {
          detail: {
            id,
            exception: {
              message: exception.message,
              name: exception.name,
              stack: exception.stack,
              ...exception
            }
          }
        })
      );
    }
  })
);
