const {getURL} = browser.runtime;
const redpop = [...document.scripts].some({src} => src.match('/pop/'));

async function run_script(name) {
  const { main, stylesheet } = await import(getURL(`/src/scripts/${name}.js`));
  
  main()
  .catch(console.error);
  
  if (stylesheet) {
    browser.tabs.insertCSS({file: stylesheet})
    .catch(console.error);
  }
}

async function destroy_script(name) {
  const { clean, stylesheet } = await import(getURL(`/src/scripts/${name}.js`));
  
  clean()
  .catch(console.error);
  
  if (stylesheet) {
    browser.tabs.removeCSS({file: stylesheet})
    .catch(console.error);
  }
}

async function onStorageChanged(changes, areaName) {
  const {enabledScripts} = changes;
  if (!enabledScripts || areaName !== 'local') {
    return;
  }
  
  const {oldValue, newValue} = enabledScripts;
  
  const newlyEnabled = newValue.filter(x => oldValue.includes(x) === false);
  const newlyDisabled = oldValue.filter(x => newValue.includes(x) === false);
  
  newlyEnabled.forEach(run_script);
  newlyDisabled.forEach(destroy_script);
}

async function init() {
  browser.storage.local.onChanged.addEventListener(onStorageChanged);

  const {enabledScripts} = await browser.storage.local.get('enabledScripts');
  if (!enabledScripts) {
    return;
  }
  
  enabledScripts.forEach(run_script);
};

if (redpop) {
  init();
}
