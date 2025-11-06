const message = 'XKit Rewritten failed to load. Try refreshing this browser tab.';
const delaySeconds = 10;

/**
 * Shows a warning if the user is logged in, but XKit initialization throws, is slow, or never resolves.
 * @param {Promise<void>} initPromise Returned promise from the XKit init function.
 */
export default function (initPromise) {
  const initialState = document.getElementById('___INITIAL_STATE___')?.textContent;
  const maybeLoggedOut = !initialState || !JSON.parse(initialState).isLoggedIn?.isLoggedIn;
  if (maybeLoggedOut) return;

  const throwIfInitRejectedOrSlow = Promise.race([
    initPromise,
    new Promise((resolve, reject) => setTimeout(reject, delaySeconds * 1000))
  ]);

  throwIfInitRejectedOrSlow.catch(() => {
    const styleElement = Object.assign(document.createElement('style'), {
      textContent: `
        #root::after {
          content: ${message};

          position: fixed;
          bottom: 0;
          width: 100vw;
          padding: 1ch;

          z-index: 100;

          pointer-events: none;

          text-align: center;
          background-color: rgb(var(--navy), 0.9);
          text-shadow:
            0 0 1px rgb(var(--navy)),
            0 0 2px rgb(var(--navy)),
            0 0 4px rgb(var(--navy));
          color: rgb(var(--white-on-dark));
          border-top: 1px solid rgb(var(--white-on-dark), 0.15);
        }
      `
    });
    document.documentElement.append(styleElement);

    // In case initialization was just very slow, hide the warning on eventual success.
    initPromise.then(() => styleElement.remove());
  });
}
