'use strict';

{
  const { getURL } = browser.runtime;
  const isRedpop = () => [...document.scripts].some(({ src }) => src.includes('/pop/'));
  const isReactLoaded = () => document.querySelector('[data-rh]') === null;

  const restartListeners = {};

  const runScript = async function (name) {
    const scriptPath = getURL(`/scripts/${name}.js`);
    const { main, clean, stylesheet, onStorageChanged } = await import(scriptPath);

    main().catch(console.error);

    if (stylesheet) {
      const link = Object.assign(document.createElement('link'), {
        rel: 'stylesheet',
        href: getURL(`/scripts/${name}.css`)
      });
      document.documentElement.appendChild(link);
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
    const scriptPath = getURL(`/scripts/${name}.js`);
    const { clean, stylesheet } = await import(scriptPath);

    clean().catch(console.error);

    if (stylesheet) {
      document.querySelector(`link[href="${getURL(`/scripts/${name}.css`)}"]`)?.remove();
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
    const url = getURL('/scripts/_index.json');
    const file = await fetch(url);
    const installedScripts = await file.json();

    return installedScripts;
  };

  const getInstalledUtils = async function () {
    const url = getURL('/util/_index.json');
    const file = await fetch(url);
    const installedUtils = await file.json();

    return installedUtils;
  };

  const createPreloadLinkElement = (name, directory) =>
    Object.assign(document.createElement('link'), {
      href: getURL(`/${directory}/${name}.js`),
      rel: 'preload',
      as: 'script',
      crossOrigin: 'anonymous'
    });

  const init = async function () {
    const [
      installedScripts,
      installedUtils,
      { enabledScripts = [] }
    ] = await Promise.all([
      getInstalledScripts(),
      getInstalledUtils(),
      browser.storage.local.get('enabledScripts')
    ]);

    const scriptPreloadLinks = installedScripts
      .filter(name => enabledScripts.includes(name))
      .map(name => createPreloadLinkElement(name, 'scripts'));

    const utilPreloadLinks = installedUtils.map(name => createPreloadLinkElement(name, 'util'));

    document.head.append(...scriptPreloadLinks, ...utilPreloadLinks);

    await waitForDocumentReady();
    if (!isRedpop()) return;

    if (!isReactLoaded()) await waitForReactLoaded();

    $('style.xkit').remove();

    browser.storage.onChanged.addListener(onStorageChanged);

    // load scripts sequentially to avoid chromium load failures
    // for (const name of installedScripts.filter(name => enabledScripts.includes(name))) {
    //   await import(getURL(`/scripts/${name}.js`));
    // }

    installedScripts
      .filter(scriptName => enabledScripts.includes(scriptName))
      .forEach(runScript);
  };

  const waitForReactLoaded = () => new Promise(resolve => {
    window.requestAnimationFrame(() => isReactLoaded() ? resolve() : waitForReactLoaded().then(resolve));
  });

  const waitForDocumentReady = () =>
    document.readyState === 'loading' &&
    new Promise(resolve =>
      document.addEventListener('readystatechange', resolve, { once: true })
    );

  init();
}
