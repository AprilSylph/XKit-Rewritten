'use strict';

{
  const { getURL } = browser.runtime;
  const redpop = [...document.scripts].some(({ src }) => src.match('/pop/'));
  const isReactLoaded = () => document.querySelector('[data-rh]') === null;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const restartListeners = {};

  const runScript = async function (name) {
    const { main, clean, stylesheet, autoRestart } = await fakeImport(`/scripts/${name}.js`);

    main()
    .catch(console.error);

    if (stylesheet) {
      const link = Object.assign(document.createElement('link'), {
        rel: 'stylesheet',
        href: getURL(`/scripts/${name}.css`)
      });
      document.documentElement.appendChild(link);
    }

    if (autoRestart) {
      restartListeners[name] = function (changes, areaName) {
        if (areaName !== 'local') {
          return;
        }

        if (Object.keys(changes).some(key => key.startsWith(`${name}.preferences`))) {
          clean().then(main);
        }
      };

      browser.storage.onChanged.addListener(restartListeners[name]);
    }
  };

  const destroyScript = async function (name) {
    const { clean, stylesheet, autoRestart } = await fakeImport(`/scripts/${name}.js`);

    clean()
    .catch(console.error);

    if (stylesheet) {
      const link = document.querySelector(`link[href="${getURL(`/scripts/${name}.css`)}"]`);
      if (link !== null) {
        link.parentNode.removeChild(link);
      }
    }

    if (autoRestart) {
      browser.storage.onChanged.removeListener(restartListeners[name]);
    }
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

  const injectDataPathnameChanger = async function () {
    const { inject } = await fakeImport('/util/inject.js');
    inject(async () => {
      window.tumblr.on('navigation', () => { document.documentElement.dataset.pathname = location.pathname; });
    });
  };

  const init = async function () {
    browser.storage.onChanged.addListener(onStorageChanged);

    const installedScripts = await getInstalledScripts();
    const { enabledScripts = [] } = await browser.storage.local.get('enabledScripts');

    enabledScripts
    .filter(scriptName => installedScripts.includes(scriptName))
    .forEach(runScript);

    document.documentElement.dataset.pathname = location.pathname.replace(/\/+$/, '');
    injectDataPathnameChanger();
  };

  const waitForReactLoaded = async function () {
    let tries = 0;

    while (tries < 300) {
      if (isReactLoaded()) {
        break;
      }

      tries++;
      await sleep(100);
    }
  };

  if (redpop) {
    waitForReactLoaded().then(init);
  }
}
