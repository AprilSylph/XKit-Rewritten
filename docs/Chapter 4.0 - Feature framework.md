# Feature framework

Each feature is comprised of a subfolder in `src/features/`, containing:
- `feature.json` metadata file (required)
- `icon.svg` icon file (optional)
- `index.js` module file (required)
- `index.css` stylesheet file (optional)

For a feature to be visible to the user, its subfolder name must also be added to [`/src/features/index.json`](../src/features/index.json).

---

The metadata file defines information the user needs to decide whether to enable the feature, and may contain preference definitions to allow the user to configure the feature.

The icon file is a scalable vector graphic to be shown in the control panel to represent the feature, alongside its metadata. Features currently use [Remix Icon](https://remixicon.com/) for all icons. Every icon must include a comment including the icon's license, and a link to where the icon originated from.

The module file is a [JavaScript module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) which is run in the [content script](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts) context of each Tumblr tab where the extension is installed (assuming the feature is enabled). They are expected to export certain named constants by the main content script, which lives in `src/content_scripts/main.js`.

The stylesheet file is a normal CSS file which, assuming the module file correctly acknowledges its existence, is automatically added to and removed from each Tumblr tab by the main content script as the feature is respectively enabled and disabled.

---

# Example feature

`/src/features/example/feature.json`
```json
{
  "title": "Example Feature",
  "description": "This doesn't do anything useful.",
  "icon": {
    "color": "#33ff00",
    "background_color": "#000000"
  },
  "help": "https://github.com/AprilSylph/XKit-Rewritten/wiki/Features#example",
  "relatedTerms": [ "hello world", "demonstration" ],
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

`/src/features/example/icon.svg`
```html
<!-- https://github.com/Remix-Design/remixicon/blob/master/License | https://remixicon.com/icon/terminal-line -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10.9999 12L3.92886 19.0711L2.51465 17.6569L8.1715 12L2.51465 6.34317L3.92886 4.92896L10.9999 12ZM10.9999 19H20.9999V21H10.9999V19Z"></path></svg>
```

`/src/features/example/index.js`
```js
import { getPreferences } from '../../utils/preferences.js';

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

`/src/features/example/index.css`
```css
:root {
  --navy: 4, 9, 128;
}
```
