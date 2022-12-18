chrome.scripting.registerContentScripts([
  {
    id: 'xkit-injected',
    js: ['injected.js'],
    matches: ['*://www.tumblr.com/*'],
    excludeMatches: [
      '*://www.tumblr.com/login',
      '*://www.tumblr.com/register',
      '*://www.tumblr.com/register?*',
      '*://www.tumblr.com/privacy/*'
    ],
    runAt: 'document_start',
    world: 'MAIN'
  }
]);
