# Feature metadata

Each feature requires a valid `feature.json` metadata file to be present in order for it to be displayed in the configuration panel.

The metadata file defines information the user needs to decide whether to enable the feature, and may contain preference definitions to allow the user to configure the feature.

None of the top-level keys for this file are technically required, so it is possible to leave it empty while you write the feature code. However, it must exist, and must be valid JSON.

<br>

## Properties

### `"title"`

|                 |                                                           |
| --------------- | --------------------------------------------------------- |
| **Type**        | `string`                                                  |
| **Mandatory**   | No                                                        |
| **Description** | The feature's title to be displayed in the control panel. |
| **Example**     | <pre lang="json">"title": "Vanilla Audio"</pre>           |

If this property is omitted, no title is displayed for the feature.

<br>

### `"description"`

|                 |                                                                               |
| --------------- | ----------------------------------------------------------------------------- |
| **Type**        | `string`                                                                      |
| **Mandatory**   | No                                                                            |
| **Description** | The feature's description to be displayed in the control panel.               |
| **Example**     | <pre lang="json">"description": "Use the browser's controls for audio"</pre>  |

If this property is omitted, no description is displayed for the feature.

<br>

### `"icon"`

|                 |                                                                                       |
| --------------- | ------------------------------------------------------------------------------------- |
| **Type**        | `{ color?: string; background_color?: string; }`                                      |
| **Mandatory**   | No                                                                                    |
| **Description** | Properties for customising how the feature's `icon.svg` renders in the control panel. |

This property is ignored if the feature does not have an `icon.svg` file.

If this property is omitted, no icon is rendered for the feature.

#### `"color"`

The CSS [`<color>`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value) to use as the icon's foreground colour.

Default value: `#000000`

#### `"background_color"`

The CSS [`<color>`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value) to use as the icon's background colour.

Default value: `#ffffff`

#### Example

```json
"icon": {
  "color": "white",
  "background_color": "#7c5cff"
}
```

<br>

### `"help"`

|                 |                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| **Type**        | `string`                                                                                                  |
| **Mandatory**   | No                                                                                                        |
| **Description** | URL pointing to the usage guide or extended description for this feature.                                 |
| **Example**     | <pre lang="json">"help": "https://github.com/AprilSylph/XKit-Rewritten/wiki/Features#vanilla-audio"</pre> |

If this property is omitted, the feature is marked as "New".

<br>

### `"relatedTerms"`

|                 |                                                                                       |
| --------------- | ------------------------------------------------------------------------------------- |
| **Type**        | `string[]`                                                                            |
| **Mandatory**   | No                                                                                    |
| **Description** | Array of search terms that should match this feature. Case insensitive.               |
| **Example**     | <pre lang="json">"relatedTerms": [ "Audio Downloader", "Audio Plus", "Audio+" ]</pre> |

<br>

### `"preferences"`

|                 |                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **Type**        | <code>Record\<string, [Preference](#preference)\></code>                                              |
| **Mandatory**   | No                                                                                                    |
| **Description** | An object consisting of one or more preference definition objects, keyed by internal preference name. |

It is recommended to use camelCase for preference names in most cases. This allows the feature code to use destructuring assignments when fetching preference values from storage, without needing to perform renames to obey the project's JavaScript style guide.

See [§ Types](#types) for details on how to write preference definition objects.

#### Example

```json
"preferences": {
  "defaultVolume": {
    "type": "percent",
    "label": "Default Volume",
    "default": 100
  }
}
```

<br>

### `"deprecated"`

|                 |                                             |
| --------------- | ------------------------------------------- |
| **Type**        | `boolean`                                   |
| **Mandatory**   | No                                          |
| **Description** | Whether or not this feature is deprecated.  |
| **Example**     | <pre lang="json">"deprecated": true</pre>   |

Deprecated features are hidden on all installations by default, allowing features to be discontinued without being outright removed.

Only installations with "special access" to a given deprecated feature will continue to be able to enable and run it.

#### Special access

If an installation has a feature enabled, and that feature then becomes deprecated, that installation gains special access to the feature.

Installations with special access to a deprecated feature will continue to see that feature in the control panel, and will be permanently allowed to toggle its enabled status, without ever losing access to the feature for as long as the feature still exists.

Special access is stored as part of an installation's saved preferences, so restoring a preference backup from an installation with access to deprecated features will also restore that access on the new installation.

<br>

## Types

### `Label`

|                 |                                                                                   |
| --------------- | --------------------------------------------------------------------------------- |
| **Type**        | `string`                                                                          |
| **Description** | The preference's text label to be displayed in the control panel.                 |
| **Example**     | <pre lang="json">"label": "Hide recommended blogs in the blog view sidebar"</pre> |

Most preference types require a label, to describe what the preference is for.

This property is always a string; this documentation defines a `Label` type to avoid re-describing the `"label"` property on each preference type that supports it.

<br>

### `Inherit`

|                 |                                                                                       |
| --------------- | ------------------------------------------------------------------------------------- |
| **Type**        | `string`                                                                              |
| **Description** | The storage key to inherit the value of, if the preference has not been set.          |
| **Example**     | <pre lang="json">"inherit": "no_recommended.preferences.hide_recommended_blogs"</pre> |

Most preference types support inheriting their value from another storage key, if both of the following are true:

- The inheriting preference (where `"inherit"` is defined) does not have any value saved in storage.
- The inherited preference (which `"inherit"` points to) does have a value saved in storage.

This is useful for splitting one option into multiple options with finer granularity, or moving preferences from one feature to another, without requiring user action if it can be avoided.

The value type for each preference type is different, so it is not automatically possible for a preference to inherit from any preference. If a preference wants to inherit a stored value that is not compatible with its preference type, the feature code must account for this on a per-case basis.

`"inherit"` is optional on every preference type that supports it.

<br>

### `Preference`

|                 |                                                                                         |
| --------------- | --------------------------------------------------------------------------------------- |
| **Type**        | <code>[CheckboxPreference](#checkboxpreference) \| [ColorPreference](#colorpreference) \| [ComponentPreference](#componentpreference) \| [PercentPreference](#percentpreference) \| [SelectPreference](#selectpreference) \| [TextPreference](#textpreference) \| [TextareaPreference](#textareapreference)</code> |
| **Description** | Union type of all preference types. See separate definitions for each preference type.  |

Most preference types require a `"default"` property, which is used as the preference's default value for most intents and purposes:

- In the control panel, installations which do not have a value saved for a preference display the preference's default value.
- When a feature runs with any unset preferences, the default value for each of those preferences is used instead of `undefined`.
  - When this happens, the default value is then stored in the user's config, as if it had been set to that value manually.

The value type of `"default"` varies; keep reading for definitions of each preference type.

<br>

### `CheckboxPreference`

|                 |                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| **Type**        | <code>{ type: "checkbox"; label: [Label](#label); default: boolean; inherit?: [Inherit](#inherit); }</code> |
| **Description** | A checkbox-type preference. Renders in the control panel as a checkbox input followed by a text label.      |

#### `"default"`

Must be a boolean. Omitting this property is not allowed.

#### Example

```json
"showTagSuggestions": {
  "type": "checkbox",
  "label": "Suggest tags from the post being reblogged",
  "default": false
}
```

<br>

### `ColorPreference`

|                 |                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Type**        | <code>{ type: "color"; label: [Label](#label); default: string; inherit?: [Inherit](#inherit); }</code> |
| **Description** | A color-type preference. Renders in the control panel as a colour picker followed by a text label.      |

#### `"default"`

Must be a six-value syntax [`<hex-color>`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/hex-color) string, or an empty string.
Omitting this property is not allowed.

#### Example

```json
"reblogColour": {
  "type": "color",
  "label": "Reblogged post colour",
  "default": ""
}
```

<br>

### `ComponentPreference`

|                 |                                                             |
| --------------- | ----------------------------------------------------------- |
| **Type**        | `{ type: "component"; src: string; }`                       |
| **Description** | A component-type preference. Allows rendering of custom UI. |

This is the only preference type which does not support `"default"` or `"inherit"`.

#### `"src"`

A URL, relative to the `src/` directory, pointing to a module file for a Web Component to be rendered in the feature's preference list.

Using a custom Web Component instead of any of the other provided preference types (or in conjunction with them) allows for complex management of a feature's data, such as creating tag bundles or listing blocked posts.

The module file's default export must be a function which returns an instance of the Web Component via `document.createElement()`.

#### Example

```json
"manageBlockedPosts": {
  "type": "component",
  "src": "/features/postblock/options/index.js"
}
```

For an example of a component preference module file, see [`src/features/postblock/options/index.js`](../src/features/postblock/options/index.js).

<br>

### `PercentPreference`

|                 |                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| **Type**        | <code>{ type: "percent"; label: [Label](#label); default: number; inherit?: [Inherit](#inherit); }</code> |
| **Description** | A percent-type preference. Renders in the control panel as a number input headed by a text label.         |

#### `"default"`

Must be an integer ranging from 0 to 100. Omitting this property is not allowed.

#### Example

```json
"defaultVolume": {
  "type": "percent",
  "label": "Default Volume",
  "default": 100
}
```

<br>

### `SelectPreference`

|                 |                                                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Type**        | <code>{ type: "select"; label: [Label](#label); options: { label: string; value: string; }[]; default: string; inherit?: [Inherit](#inherit); }</code>  |
| **Description** | A select-type preference. Renders in the control panel as a dropdown menu headed by a text label.                                                       |

#### `"options"`

An array of objects, each with a `"label"` and `"value"` property.

- `"label"` (`string`) is the label shown to the user for this option.
- `"value"` (`string`) is the value stored for this option.

#### `"default"`

Must be a string that matches the `"value"` of one of the defined options. Omitting this property is not allowed.

#### Example

```json
"popupPosition": {
  "type": "select",
  "label": "Popup position",
  "options": [
    { "value": "above", "label": "Above reblog button" },
    { "value": "below", "label": "Below reblog button" }
  ],
  "default": "below"
}
```

<br>

### `TextPreference`

|                 |                                                                                                           |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| **Type**        | <code>{ type: "text"; label: [Label](#label); default: string; inherit?: [Inherit](#inherit); }</code>    |
| **Description** | A text-type preference. Renders in the control panel as a single-line text field headed by a text label.  |

#### `"default"`

Must be a string. Omitting this property is not allowed.

#### Example

```json
"originalPostTag": {
  "type": "text",
  "label": "Original post tag",
  "default": ""
}
```

<br>

### `TextareaPreference`

|                 |                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| **Type**        | <code>{ type: "textarea"; label: [Label](#label); default: string; inherit?: [Inherit](#inherit); }</code>  |
| **Description** | A textarea-type preference. Renders in the control panel as a multi-line text field headed by a text label. |

#### `"default"`

Must be a string. Omitting this property is not allowed.

#### Example

```json
"whitelistedUsernames": {
  "type": "textarea",
  "label": "Always show reblogs from these blogs (comma-separated)",
  "default": ""
}
```

<br>

## Schema

[`schemas/feature.json`](../schemas/feature.json)
