'use strict';

{
  const redpop = [...document.scripts].some(({ src }) => src.includes('/pop/'));
  const isReactLoaded = () => document.querySelector('[data-rh]') === null;

  const restartListeners = {};

  const runScript = async function (name) {
    const scriptPath = browser.runtime.getURL(`/features/${name}.js`);
    const { main, clean, stylesheet, styleElement, onStorageChanged } = await import(scriptPath);

    if (main) {
      main().catch(console.error);
    }
    if (stylesheet) {
      const link = Object.assign(document.createElement('link'), {
        rel: 'stylesheet',
        href: browser.runtime.getURL(`/features/${name}.css`)
      });
      document.documentElement.appendChild(link);
    }
    if (styleElement) {
      document.documentElement.append(styleElement);
    }

    restartListeners[name] = function (changes, areaName) {
      if (areaName !== 'local') return;

      const { enabledScripts } = changes;
      if (enabledScripts && !enabledScripts.newValue.includes(name)) return;

      if (onStorageChanged instanceof Function) {
        onStorageChanged(changes, areaName);
      } else if (Object.keys(changes).some(key => key.startsWith(`${name}.preferences`) && changes[key].oldValue !== undefined)) {
        clean().then(main);
      }
    };

    browser.storage.onChanged.addListener(restartListeners[name]);
  };

  const destroyScript = async function (name) {
    const scriptPath = browser.runtime.getURL(`/features/${name}.js`);
    const { clean, stylesheet, styleElement } = await import(scriptPath);

    if (clean) {
      clean().catch(console.error);
    }
    if (stylesheet) {
      document.querySelector(`link[href="${browser.runtime.getURL(`/features/${name}.css`)}"]`)?.remove();
    }
    if (styleElement) {
      styleElement.remove();
    }

    browser.storage.onChanged.removeListener(restartListeners[name]);
    delete restartListeners[name];
  };

  const onStorageChanged = async function (changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    const { enabledScripts } = changes;

    if (enabledScripts) {
      const { oldValue = [], newValue = [] } = enabledScripts;

      const newlyEnabled = newValue.filter(x => oldValue.includes(x) === false);
      const newlyDisabled = oldValue.filter(x => newValue.includes(x) === false);

      newlyEnabled.forEach(runScript);
      newlyDisabled.forEach(destroyScript);
    }
  };

  const getInstalledScripts = async function () {
    const url = browser.runtime.getURL('/features/_index.json');
    const file = await fetch(url);
    const installedScripts = await file.json();

    return installedScripts;
  };

  const initMainWorld = () => new Promise(resolve => {
    document.documentElement.addEventListener('xkitinjectionready', resolve, { once: true });

    const { nonce } = [...document.scripts].find(script => script.getAttributeNames().includes('nonce'));
    const script = document.createElement('script');
    script.type = 'module';
    script.nonce = nonce;
    script.src = browser.runtime.getURL('/main_world/index.js');
    document.documentElement.append(script);
  });

  const init = async function () {
    $('style.xkit').remove();

    browser.storage.onChanged.addListener(onStorageChanged);

    const [
      installedScripts,
      { enabledScripts = [] }
    ] = await Promise.all([
      getInstalledScripts(),
      browser.storage.local.get('enabledScripts'),
      initMainWorld()
    ]);

    /**
     * fixes WebKit (Chromium, Safari) simultaneous import failure of files with unresolved top level await
     * @see https://github.com/sveltejs/kit/issues/7805#issuecomment-1330078207
     */
    await Promise.all(['css_map', 'language_data', 'user'].map(name => import(browser.runtime.getURL(`/utils/${name}.js`))));

    installedScripts
      .filter(scriptName => enabledScripts.includes(scriptName))
      .forEach(runScript);
  };

  const waitForReactLoaded = () => new Promise(resolve => {
    window.requestAnimationFrame(() => isReactLoaded() ? resolve() : waitForReactLoaded().then(resolve));
  });

  if (redpop) {
    isReactLoaded() ? init() : waitForReactLoaded().then(init);
  }
}
