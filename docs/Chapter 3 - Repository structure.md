# Repository structure

## `XKit-Rewritten/`

```
XKit-Rewritten/
├── assets/               Source files for original images
├── dev/                  Developer scripts
├── docs/                 Technical documentation
├── src/                  Extension source code
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── package-lock.json
└── package.json
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
