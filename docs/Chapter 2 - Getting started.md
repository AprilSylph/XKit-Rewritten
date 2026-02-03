# Getting started

## Prerequisites

- [Download and install Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) for your platform
- [Install EditorConfig](https://editorconfig.org/#download) for your favourite text editor
- Install the project dependencies with **`npm install`**

## CLI commands

- **`npm start`**: Run your local copy of the addon (see [`web-ext run`](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#web-ext-run)).
- **`npm test`**: Runs all linters. Will report any syntax or style errors.
- **`npm test --ignore-scripts`**: Runs only the addon linter. Only reports syntax and WebExtension API errors.
- **`npm run autofix`**: Automatically fixes any style errors.
- **`npm run build`**: Creates an unsigned ZIP of the addon.

### Web-only development

If you're unable to get set up locally, all you need to do is go to the **Actions** tab in your fork, then to the **CI** workflow, then press "Run workflow", and choose whichever branch you've made changes to. This will build an unsigned ZIP of the addon, and make it available for download on the workflow run summary page.

## Loading the project into the browser

The extension source code is located in `src/`. Before loading your development version, first be sure to disable the release version if you have it installed on the browser you're testing on.

- Firefox: [Loading a temporary extension](https://firefox-source-docs.mozilla.org/devtools-user/about_colon_debugging/index.html#extensions)
- Chromium: [Load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)

Be sure to reload the extension each time you modify its files, and refresh any open Tumblr tabs in that browser. Otherwise, your changes may not be reflected.
