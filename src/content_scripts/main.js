'use strict';

{
  const MAX_BOOT_ATTEMPTS = 3600; // 60 seconds on 60Hz displays; 10 seconds on 360Hz displays

  const enabledFeaturesKey = 'enabledScripts';

  const redpop = [...document.scripts].some(({ src }) => src.includes('/pop/'));
  const isReactLoaded = () => document.querySelector('[data-rh]') === null;

  const restartListeners = {};

  const timestamp = Date.now(); // Prevent referencing outdated resources after Firefox extension update/restart

  const getFeature = name => import(browser.runtime.getURL(`/features/${name}/index.js`));
  const getUtil = name => import(browser.runtime.getURL(`/utils/${name}.js`));

  const runFeature = async function ({
    main,
    clean,
    stylesheet,
    styleElement,
    onStorageChanged,
  }) {
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

  const destroyFeature = async function ({
    clean,
    stylesheet,
    styleElement,
  }) {
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

      (await Promise.all(newlyEnabled.map(getFeature))).forEach(runFeature);
      (await Promise.all(newlyDisabled.map(getFeature))).forEach(destroyFeature);
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

  /**
   * Shows an informative modal if the extension context is invalidated (e.g. after extension is autoupdated or manually disabled in Chromium). Should do nothing in Firefox, which stops running all extension context javascript immediately.
   */
  const warnOnExtensionContextInvalidated = async () => {
    const { showContextInvalidatedModal } = await import(browser.runtime.getURL('/utils/modals.js'));

    const isExtensionContextValid = () => { try { browser.runtime.getURL(''); return true; } catch { return false; } };

    let failures = 0;
    const intervalID = setInterval(() => {
      failures = isExtensionContextValid() ? 0 : failures + 1;
      if (failures >= 5 && !document.getElementById('xkit-modal')) {
        showContextInvalidatedModal();
        clearInterval(intervalID);
      }
    }, 1000);
  };

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

    const orderedEnabledFeatures = installedFeatures.filter(name => enabledFeatures.includes(name));

    /**
     * Fixes WebKit (Chromium, Safari) simultaneous import failure of files with unresolved top level await.
     * @see https://bugs.webkit.org/show_bug.cgi?id=242740
     */
    await Promise.all(['css_map', 'language_data', 'user'].map(getUtil));

    /**
     * Populates the module cache and then runs features in order.
     * This ensures that feature run order is unaffected by module resolution timing.
     * @see https://github.com/AprilSylph/XKit-Rewritten/discussions/2357
     */
    (await Promise.all(orderedEnabledFeatures.map(getFeature))).forEach(runFeature);

    warnOnExtensionContextInvalidated();
  };

  const waitForReactLoaded = async function () {
    for (let attempts = 0; attempts < MAX_BOOT_ATTEMPTS; attempts++) {
      if (isReactLoaded()) return;

      await new Promise((resolve) => window.requestAnimationFrame(resolve));
    }

    throw new Error('XKit Rewritten boot failed; React did not load after 10+ seconds.');
  };

  if (redpop) {
    waitForReactLoaded()
      .then(init)
      .catch(console.error);
  }
}
