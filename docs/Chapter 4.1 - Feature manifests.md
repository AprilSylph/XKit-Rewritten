# Feature manifests

Each feature requires a metadata file in order to be displayed in the configuration panel. Since none of the top-level keys are technically required, you can leave the file as essentially empty (simply `{}`), but it must exist and must be valid JSON.

## Supported keys

### `"title"`
- Type: String
- Required: No

Human-readable title for this feature. Defaults to the script's filename if not provided.

### `"description"`
- Type: String
- Required: No

Human-readable description for this feature. Defaults to an empty string if not provided.

### `"icon"`
- Type: Object
- Required: No

Object with three supported keys:

#### `"icon"`: `"class_name"`
- Type: String
- Required: Yes

[Remix Icon](https://remixicon.com/) class of the icon for the feature. If not provided, an icon is not generated.

#### `"icon"`: `"color"`
- Type: String[\<color\>](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value)
- Required: No

The foreground colour of the feature icon. Defaults to pure black (`#000000`) if not provided.

#### `"icon"`: `"background_color"`
- Type: String[\<color\>](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value)
- Required: No

The background colour of the feature icon. Defaults to pure white (`#ffffff`) if not provided.

### `"help"`
- Type: String
- Required: No

URL which points to a usage guide or extended description for the feature.

### `"relatedTerms"`
- Type: Array
- Required: No

An optional array of strings related to this script that a user might search for. Case insensitive.

### `"preferences"`
- Type: Object
- Required: No

Object with 1 or more custom keys; each key is used internally as a preference's name.

It is recommended to use camelCase for each preference name, so that the script can destructure each preference without renaming it.

#### `"preferences"`: \<preference name\>
- Type: Object

#### `"preferences"`: \<preference name\>: `"type"`
- Type: String
- Required: Yes

Type of preference. Supported values: `"checkbox"`, `"text"`, `"color"`, `"select"`, `"textarea"`, `"iframe"`

#### `"preferences"`: \<preference name\>: `"label"`
- Type: String
- Required: Yes

Label displayed to the user to describe the preference.

#### `"preferences"`: \<preference name\>: `"options"`
- Type: Array
- Required: Yes, if `type` is `"select"`

For `"select"`-type preferences, an array of objects each with `"value"` and `"label"` properties. Unused for other preference types.

#### `"preferences"`: \<preference name\>: `"src"`
- Type: String
- Required: Yes, if `type` is `"iframe"`

For `"iframe"`-type preferences, a relative address to be embedded in the script's preference list. Unused for other preference types.

#### `"preferences"`: \<preference name\>: `"default"`
- Type: Any
- Required: Yes, unless `type` is `"iframe"`

Default value of the preference to display to the user.

If the preference `type` is `"checkbox"`, this value should be a boolean.  
If the preference `type` is `"text"` or `"textarea"`, this value should be a string.  
If the preference `type` is `"color"`, this value should either be a string representing a hexadecimal colour code (i.e. `"#1a2b3c"`) or an empty string.  
If the preference `type` is `"select"`, this value should be a string that matches one of the `"options"` item's `"value"`.

#### `"preferences"`: \<preference name\>: `"inherit"`
- Type: String
- Required: No

The storage key to inherit the value of, if the preference has not been set.

### `"deprecated"`
- Type: Boolean
- Required: No

Whether to hide the feature on installations on which it was not enabled at the time of deprecation.

### `"deprecationReason"`
- Type: String
- Required: No

String to show in the configuration panel if the script is deprecated but enabled (default: "deprecated")
