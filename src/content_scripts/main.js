'use strict';

{
  const enabledFeaturesKey = 'enabledScripts';

  const redpop = [...document.scripts].some(({ src }) => src.includes('/pop/'));
  const isReactLoaded = () => document.querySelector('[data-rh]') === null;

  const restartListeners = {};

  // prevent referencing outdated resources after firefox extension update/restart
  const timestamp = Date.now();

  const runFeature = async function (name) {
    const {
      main,
      clean,
      stylesheet,
      styleElement,
      onStorageChanged,
    } = await import(browser.runtime.getURL(`/features/${name}/index.js`));

    if (main) {
      main().catch(console.error);
    }
    if (stylesheet) {
      const link = Object.assign(document.createElement('link'), {
        rel: 'stylesheet',
        href: browser.runtime.getURL(`/features/${name}/index.css?t=${timestamp}`),
        className: 'xkit',
      });
      document.documentElement.appendChild(link);
    }
    if (styleElement) {
      styleElement.dataset.xkitFeature = name;
      document.documentElement.append(styleElement);
    }

    restartListeners[name] = async (changes) => {
      const { [enabledFeaturesKey]: enabledFeatures } = changes;
      if (enabledFeatures && !enabledFeatures.newValue.includes(name)) return;

      if (onStorageChanged instanceof Function) {
        onStorageChanged(changes);
      } else if (Object.keys(changes).some(key => key.startsWith(`${name}.preferences`) && changes[key].oldValue !== undefined)) {
        await clean?.();
        await main?.();
      }
    };

    browser.storage.local.onChanged.addListener(restartListeners[name]);
  };

  const destroyFeature = async function (name) {
    const {
      clean,
      stylesheet,
      styleElement,
    } = await import(browser.runtime.getURL(`/features/${name}/index.js`));

    if (clean) {
      clean().catch(console.error);
    }
    if (stylesheet) {
      document.querySelector(`link[href^="${browser.runtime.getURL(`/features/${name}/index.css`)}"]`)?.remove();
    }
    if (styleElement) {
      styleElement.remove();
    }

    browser.storage.local.onChanged.removeListener(restartListeners[name]);
    delete restartListeners[name];
  };

  const onStorageChanged = async function (changes) {
    const { [enabledFeaturesKey]: enabledFeatures } = changes;

    if (enabledFeatures) {
      const { oldValue = [], newValue = [] } = enabledFeatures;

      const newlyEnabled = newValue.filter(x => oldValue.includes(x) === false);
      const newlyDisabled = oldValue.filter(x => newValue.includes(x) === false);

      newlyEnabled.forEach(runFeature);
      newlyDisabled.forEach(destroyFeature);
    }
  };

  const getInstalledFeatures = async function () {
    const url = browser.runtime.getURL('/features/index.json');
    const file = await fetch(url);
    const installedFeatures = await file.json();

    return installedFeatures;
  };

  const initMainWorld = () => new Promise(resolve => {
    document.documentElement.addEventListener('xkit-injection-ready', resolve, { once: true });

    const { nonce } = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));
    const script = Object.assign(document.createElement('script'), {
      type: 'module',
      nonce,
      src: browser.runtime.getURL(`/main_world/index.js?t=${timestamp}`),
    });
    document.documentElement.append(script);
  });

  const init = async function () {
    $('style.xkit, link.xkit').remove();

    browser.storage.local.onChanged.addListener(onStorageChanged);

    const [
      installedFeatures,
      { [enabledFeaturesKey]: enabledFeatures = [] },
    ] = await Promise.all([
      getInstalledFeatures(),
      browser.storage.local.get(enabledFeaturesKey),
      initMainWorld(),
    ]);

    /**
     * fixes WebKit (Chromium, Safari) simultaneous import failure of files with unresolved top level await
     * @see https://github.com/sveltejs/kit/issues/7805#issuecomment-1330078207
     */
    await Promise.all(['css_map', 'language_data', 'user'].map(name => import(browser.runtime.getURL(`/utils/${name}.js`))));

    installedFeatures
      .filter(featureName => enabledFeatures.includes(featureName))
      .forEach(runFeature);
  };

  const waitForReactLoaded = () => new Promise(resolve => {
    window.requestAnimationFrame(() => isReactLoaded() ? resolve() : waitForReactLoaded().then(resolve));
  });

  /**
   * Shows a warning if the user is logged in, but XKit initialization throws, is slow, or never resolves.
   * @param {Promise<void>} initPromise Returned promise from the XKit init function.
   */
  const warnOnInitFailure = function (initPromise) {
    const failureMessage = 'XKit Rewritten failed to load. Try refreshing this browser tab.';
    const delaySeconds = 10;

    const initialState = document.getElementById('___INITIAL_STATE___')?.textContent;
    const maybeLoggedOut = !initialState || !JSON.parse(initialState).isLoggedIn?.isLoggedIn;
    if (maybeLoggedOut) return;

    const throwIfInitRejectedOrSlow = Promise.race([
      initPromise,
      new Promise((resolve, reject) => setTimeout(reject, delaySeconds * 1000))
    ]);

    throwIfInitRejectedOrSlow.catch(() => {
      const styleElement = Object.assign(document.createElement('style'), {
        className: 'xkit',
        textContent: `
          #root::after {
            content: "${failureMessage}";

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
  };

  if (redpop) {
    const initPromise = isReactLoaded() ? init() : waitForReactLoaded().then(init);
    warnOnInitFailure(initPromise);
  }
}
