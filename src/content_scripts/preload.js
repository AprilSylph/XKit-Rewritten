'use strict';

{
  const { getURL } = browser.runtime;
  const isRedpop = () => [...document.scripts].some(({ src }) => src.includes('/pop/'));

  const getInstalledScripts = async function () {
    const url = getURL('/scripts/_index.json');
    const file = await fetch(url);
    const installedScripts = await file.json();

    return installedScripts;
  };

  const installedUtils = [
    'control_buttons',
    'crypto',
    'css_map',
    'dom',
    'inject',
    'interface',
    'language_data',
    'meatballs',
    'mega_editor',
    'modals',
    'mutations',
    'notifications',
    'post_actions',
    'preferences',
    'react_props',
    'remixicon',
    'sidebar',
    'tumblr_helpers',
    'user'
  ];

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
      { enabledScripts = [] }
    ] = await Promise.all([
      getInstalledScripts(),
      browser.storage.local.get('enabledScripts'),
      documentInteractive
    ]);

    if (!isRedpop()) return;

    const installedEnabledScripts = installedScripts
      .filter(name => enabledScripts.includes(name));

    document.head.append(
      ...installedEnabledScripts.map(name => createPreloadLinkElement(`/scripts/${name}.js`)),
      ...installedUtils.map(name => createPreloadLinkElement(`/util/${name}.js`))
    );
  };

  const documentInteractive = new Promise(resolve =>
    document.readyState === 'loading'
      ? document.addEventListener('readystatechange', resolve, { once: true })
      : resolve()
  );

  preload();
}
