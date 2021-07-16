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
├── browser_action/       Files for extension popup
├── content_scripts/      Main boot script and static CSS
├── icons/                Extension icons
├── lib/                  External libraries
├── scripts/              User-facing features
├── util/                 Helpers for writing features
└── manifest.json
```

#### `scripts/`

User-facing features directory. 

```
scripts/
├── _index.json           Index of feature names
├── *.css                 Feature stylesheets
├── *.js                  Feature scripts
├── *.json                Feature manifests
├── */                    Additional feature files, e.g.:
│   ├── options/          Custom preferences interface files
│   └── script.js         Child scripts
```
