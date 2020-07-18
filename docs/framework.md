# Scripts framework

Scripts are composed of a minimum of two files: a `.js` file (the main module), and a `.json` file (containing its metadata).

Note: XKit should only be considered "running" in a content script context; the browser action popup page cannot evaluate the modules themselves (only read their metadata files), and thus only controls the XKit configuration. XKit then listens for configuration changes from the content script context, and reflects the changes automatically.

## Module files

Each module is required to return at least two async functions.

#### `main()`
- Type: Async Function
- Required: Yes

The main function of the script. Will be called whenever the user enables the script, even if the tab(s) XKit is running in is/are not focused. Will also be called upon pageload if the script is enabled.

#### `clean()`
- Type: Async Function
- Required: Yes

The cleanup function of the script. Called whenever the user disables the script, also regardless of tab focus.

#### `stylesheet`
- Type: String
- Required: No

The pathname of the script's CSS file. This is automatically added and removed during the script's lifecycle.

This path is automatically fed into `browser.runtime.getURL()`, so should start with a `/` to ensure the path is resolved starting at the extension's root. This also means that using externally-hosted stylesheets is disallowed.

## Metadata files

Each module should be accompanied by a `.json` file of matching name; i.e. `example.js` should be accompanied by `example.json` in the same directory level. Right now, only two keys are supported; expect more to be added in future.

#### `"title"`
- Type: String
- Required: No

Human-readable title for this script. Defaults to the script's filename if not provided.

#### `"description"`
- Type: String
- Required: No

Human-readable description for this script. Defaults to an empty string if not provided.

# Scripts index

Since WebExtensions cannot natively read the contents of a directory, there is a file (`src/scripts/_index.json`) which lists the relative filename (without file extensions) of each installed script. If you build a new script, it will not be recognised until its name is added to this file.
