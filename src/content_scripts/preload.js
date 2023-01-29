'use strict';

{
  const { getURL } = browser.runtime;

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

  const createPreloadLinkElement = path =>
    Object.assign(document.createElement('link'), {
      href: getURL(path),
      rel: 'preload',
      as: 'script',
      crossOrigin: 'anonymous'
    });

  const preload = async function () {
    const [
      installedScripts,
      installedUtils,
      { enabledScripts = [] }
    ] = await Promise.all([
      getInstalledScripts(),
      getInstalledUtils(),
      browser.storage.local.get('enabledScripts')
    ]);

    const installedEnabledScripts = installedScripts
      .filter(name => enabledScripts.includes(name));

    document.head.append(
      ...installedEnabledScripts.map(name => createPreloadLinkElement(`/scripts/${name}.js`)),
      ...installedUtils.map(name => createPreloadLinkElement(`/util/${name}.js`))
    );
  };

  preload();
}
