'use strict';

{
  const MAX_BOOT_ATTEMPTS = 3600; // 60 seconds on 60Hz displays; 10 seconds on 360Hz displays

  const enabledFeaturesKey = 'enabledScripts';

  const redpop = [...document.scripts].some(({ src }) => src.includes('/pop/'));
  const isReactLoaded = () => document.querySelector('[data-rh]') === null;

  const restartListeners = {};

  const timestamp = Date.now(); // Prevent referencing outdated resources after Firefox extension update/restart

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
    ]);

    /**
     * Fixes WebKit (Chromium, Safari) simultaneous import failure of files with unresolved top level await
     * @see https://github.com/sveltejs/kit/issues/7805#issuecomment-1330078207
     */
    await Promise.all(['css_map', 'language_data', 'user'].map(name => import(browser.runtime.getURL(`/utils/${name}.js`))));

    installedFeatures
      .filter(featureName => enabledFeatures.includes(featureName))
      .forEach(runFeature);

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
