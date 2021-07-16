# Feature framework

Features are comprised of a minimum of two files:
- `.json` manifest file (required)
- `.js` module file (required)
- `.css` stylesheet file (optional)

These files all live in the `src/scripts/` directory. The filenames (minus the file extension) must match for the files to be recognised as belonging to the same feature.

For a feature to be visible to the user, its name must be added to `/src/scripts/_index.json`.

---

The manifest file defines information the user needs to decide whether to enable the feature, and may contain preference definitions to allow the user to configure the feature.

The module file is a [JavaScript module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) which is run in the [content script](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts) context of each Tumblr tab where the extension is installed (assuming the feature is enabled). They are expected to export certain named constants by the main content script, which lives in `src/content_scripts/main.js`.

The stylesheet file is a normal CSS file which, assuming the module file correctly acknowledges its existence, is automatically added to and removed from each Tumblr tab by the main content script as the feature is respectively enabled and disabled.

---

# Example feature

`/src/scripts/example.json`
```json
{
  "title": "Example Script",
  "description": "This doesn't do anything useful.",
  "icon": {
    "class_name": "ri-terminal-line",
    "color": "#33ff00",
    "background_color": "#000000"
  },
  "preferences": {
    "log": {
      "type": "checkbox",
      "label": "Log to console",
      "default": true
    },
    "whatToLog": {
      "type": "text",
      "label": "What to say?",
      "default": "world"
    },
    "level": {
      "type": "select",
      "label": "Console output type",
      "options": [
        { "value": "debug", "label": "Debug" },
        { "value": "error", "label": "Error" },
        { "value": "info", "label": "Info" },
        { "value": "log", "label": "Log" },
        { "value": "warn", "label": "Warn" }
      ],
      "default": "log"
    }
  }
}
```

`/src/scripts/example.js`
```js
import { getPreferences } from '../util/preferences.js';

export const main = async function () {
  const { log, whatToLog, level } = await getPreferences('example');

  if (log === true) {
    console[level](`Hello, ${whatToLog}!`);
  }
};

export const clean = async function () {
  // Nothing to undo here.
};

export const stylesheet = true;
```

`/src/scripts/example.css`
```css
:root {
  --navy: 4, 9, 128;
}
```
