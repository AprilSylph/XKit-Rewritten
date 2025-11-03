# Getting started

## Prerequisites

- [Download and install Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) for your platform
- [Install EditorConfig](https://editorconfig.org/#download) for your favourite text editor
- Install the project dependencies with **`npm install`**

## CLI commands

- **`npm test`**: Runs all linters. Will report any syntax or style errors.
- **`npm test --ignore-scripts`**: Runs only the addon linter. Only reports syntax and WebExtension API errors.
- **`npm run build`**: Creates an unsigned ZIP of the addon. Useful for debugging issues you can't reproduce.
- **`npm run enable-hooks`**: Enables a git hook that lints staged files locally before they are committed.
- **`npm run disable-hooks`**: Disables git hooks.

### Web-only development

If you're unable to get set up locally, all you need to do is go to the **Actions** tab in your fork, then to the **Build** workflow, and then use "Run workflow" with whichever branch you've made changes to. This will lint and then build the WebExtension for you to download and test! It will give you a ZIP within a ZIP, so be sure to extract from the inner ZIP to avoid extracting everything twice. If there are any major issues, this workflow will fail and tell you what went wrong under the "Lint WebExtension" step.

## Loading the project into the browser

The extension source code is located in `src/`. Before loading your development version, first be sure to disable the release version if you have it installed on the browser you're testing on.

- Firefox: [Loading a temporary extension](https://firefox-source-docs.mozilla.org/devtools-user/about_colon_debugging/index.html#extensions)
- Chromium: [Load an unpacked extension](https://developer.chrome.com/docs/extensions/mv2/getstarted/#manifest)

Be sure to reload the extension each time you modify its files, and refresh any open Tumblr tabs in that browser. Otherwise, your changes may not be reflected.

Alternatively—particularly for testing a fresh install by a new user—you can run:

- **`npm start`**: Loads the addon into a temporary browser process and automatically refreshes it when changed.

You can run `npm start -- --f=nightly`, `npm start -- --f=deved` or `npm start -- --t=chromium` to run the test in Firefox Nightly, Firefox Developer Edition, or Chrome, respectively, if you have those browsers installed.
