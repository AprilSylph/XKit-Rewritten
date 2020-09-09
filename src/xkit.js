'use strict';

{
  const {getURL} = browser.runtime;
  const redpop = [...document.scripts].some(({src}) => src.match('/pop/'));
  const isReactLoaded = () => document.querySelector('[data-rh]') === null;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const runScript = async function(name) {
    const { main, stylesheet } = await fakeImport(`/src/scripts/${name}.js`);

    main()
    .catch(console.error);

    if (stylesheet) {
      const link = Object.assign(document.createElement('link'), {
        rel: 'stylesheet',
        href: getURL(`/src/scripts/${name}.css`),
      });
      document.documentElement.appendChild(link);
    }
  };

  const destroyScript = async function(name) {
    const { clean, stylesheet } = await fakeImport(`/src/scripts/${name}.js`);

    clean()
    .catch(console.error);

    if (stylesheet) {
      const link = document.querySelector(`link[href="${getURL(`/src/scripts/${name}.css`)}"]`);
      if (link !== null) {
        link.parentNode.removeChild(link);
      }
    }
  };

  const onStorageChanged = async function(changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    const {enabledScripts} = changes;

    if (enabledScripts) {
      const {oldValue = [], newValue = []} = enabledScripts;

      const newlyEnabled = newValue.filter(x => oldValue.includes(x) === false);
      const newlyDisabled = oldValue.filter(x => newValue.includes(x) === false);

      newlyEnabled.forEach(runScript);
      newlyDisabled.forEach(destroyScript);
    }
  };

  const init = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);

    const {enabledScripts = []} = await browser.storage.local.get('enabledScripts');

    enabledScripts.forEach(runScript);
  };

  const waitForReactLoaded = async function() {
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
