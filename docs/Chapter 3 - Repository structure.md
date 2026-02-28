# Repository structure

## `XKit-Rewritten/`

```
XKit-Rewritten/
├── assets/               Source files for original images
├── dev/                  Developer scripts
├── docs/                 Technical documentation
├── src/                  Extension source code
├── CONTRIBUTING.md
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
└── SECURITY.md
```

### `src/`

Extension source code directory. Only contains files necessary for operation.

```
src/
├── action/               Files for extension popup
├── content_scripts/      Main boot script and static CSS
├── features/             User-facing features
├── icons/                Extension icons
├── lib/                  External libraries
├── main_world/           Scripts to execute in the webpage context
├── utils/                Helpers for writing features
└── manifest.json
```

#### `features/`

User-facing features directory.

```
features/
├── index.json            Index of feature names
├── <feature_name>/       Feature folders
│   ├── feature.json      The feature's metadata
│   ├── index.css         The feature's stylesheet
│   ├── index.js          The feature's module script
│   ├── options/          Files for rendering the feature's preferences
│   └── <option_name>.js  Child scripts
```

#### `main_world/`

These scripts run in the context of the webpage, rather than the extension sandbox.

See [src/utils/inject.js](../src/utils/inject.js) for how to run these scripts as part of feature code.

```
main_world/
├── index.js              Facilitates communication between inject() and task-specific module scripts
└── <script_name>.js      Task-specific modules; each consists of a single function as its default export
```
