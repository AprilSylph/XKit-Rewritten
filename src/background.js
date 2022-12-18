chrome.scripting.registerContentScripts([
  {
    id: 'xkit-unsandboxed-injection',
    js: ['./content_scripts/injection.js'],
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
