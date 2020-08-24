'use strict';

{
  const {getURL} = browser.runtime;
  const redpop = [...document.scripts].some(({src}) => src.match('/pop/'));
  const isReactLoaded = () => document.querySelector('[data-rh]') === null;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const run_script = async function(name) {
    const { main, stylesheet } = await fakeImport(`/src/scripts/${name}.js`);

    main()
    .catch(console.error);

    if (stylesheet) {
      const link = Object.assign(document.createElement('link'), {
        rel: 'stylesheet',
        href: getURL(stylesheet),
      });
      document.documentElement.appendChild(link);
    }
  };

  const destroy_script = async function(name) {
    const { clean, stylesheet } = await fakeImport(`/src/scripts/${name}.js`);

    clean()
    .catch(console.error);

    if (stylesheet) {
      const link = document.querySelector(`link[href="${getURL(stylesheet)}"]`);
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

      newlyEnabled.forEach(run_script);
      newlyDisabled.forEach(destroy_script);
    }
  };

  const init = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);

    const {enabledScripts = []} = await browser.storage.local.get('enabledScripts');

    enabledScripts.forEach(run_script);
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
