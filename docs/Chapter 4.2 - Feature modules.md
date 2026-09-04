# Feature modules

Every feature must have a module file to define its behaviour.

Feature module files are expected to export certain named constants by the main content script:

<br>

## Methods

### `main()`

|                 |                                                                                               |
|-----------------|-----------------------------------------------------------------------------------------------|
| **Type**        | `() => Promise<void>`                                                                         |
| **Mandatory**   | No                                                                                            |
| **Description** | The main function of the feature. Everything this function does must be undone by `clean()`.  |
| **Example**     | <pre lang="js">export const main = async () => addSidebarItem(sidebarOptions);</pre>          |

When a Tumblr tab is loaded with XKit Rewritten enabled, every enabled feature is evaluated and runs their `main()` function.

When any open Tumblr tabs have XKit Rewritten running, and an XKit Rewritten feature is then enabled by the user:
1. If the feature has not been ran in any of Tumblr tabs previously, the feature module is evaluated in those tabs.
2. The feature's `main()` function is ran in all Tumblr tabs, even if those tabs are not active or focused.

<br>

### `clean()`

|                 |                                                                                             |
|-----------------|---------------------------------------------------------------------------------------------|
| **Type**        | `() => Promise<void>`                                                                       |
| **Mandatory**   | No                                                                                          |
| **Description** | The cleanup function of the feature. This function must undo everything done by `main()`.   |
| **Example**     | <pre lang="js">export const clean = async () => removeSidebarItem(sidebarOptions.id);</pre> |

When a user disables an XKit Rewritten feature, the feature's `clean()` function is ran in all Tumblr tabs, even if those tabs are not active or focused.

<br>

### `onStorageChanged()`

|                 |                                                                                                                                 |
|-----------------|---------------------------------------------------------------------------------------------------------------------------------|
| **Type**        | <code>(changes: Record\<string, <a href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageChange">StorageChange</a>\>) => Promise\<void\></code>  |
| **Mandatory**   | No                                                                                                                              |
| **Description** | The preference-handling code of the feature. If not specified, the feature will be restarted when its preferences are changed.  |
| **Example**     | <pre lang="js">export const onStorageChanged = async (changes) => Object.keys(changes).some(key => key.startsWith('panorama')) && main();</pre> |

If provided, this function is added as a [`storage.StorageArea.onChanged`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/StorageArea/onChanged) listener on [`browser.storage.local`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local).

This listener is fired on _all_ changes to `browser.storage.local`, even if the changes are to preferences for another feature, or to storage keys that are not preferences at all. This is useful for reacting to changes in another feature's data (e.g.: Quick Reblog displaying new Quick Tags bundles as they are created), or applying changes made to the feature's own custom storage key across all open Tumblr tabs (e.g.: PostBlock hiding newly-hidden posts).

<br>

## Properties

### `stylesheet`

|                 |                                                                                                     |
|-----------------|-----------------------------------------------------------------------------------------------------|
| **Type**        | `boolean`                                                                                           |
| **Mandatory**   | No                                                                                                  |
| **Description** | Whether the feature has a static stylesheet, found at `./index.css` in the feature directory if so. |
| **Example**     | <pre lang="js">export const stylesheet = true;</pre>                                                |

When a feature is ran (i.e., its `main()` function is called), and that feature exports this constant as `true`, its static stylesheet is also fetched and added to the document.

When the same feature is disabled, its static stylesheet is also removed from the document.

<br>

### `styleElement`

|                 |                                                                                                 |
|-----------------|-------------------------------------------------------------------------------------------------|
| **Type**        | `HTMLStyleElement`                                                                              |
| **Mandatory**   | No                                                                                              |
| **Description** | A JavaScript pointer to a `<style class="xkit">` element, as created by the `buildStyle` util.  |
| **Example**     | <pre lang="js">export const styleElement = buildStyle();</pre>                                  |

When a feature is ran (i.e., its `main()` function is called), and that feature exports this constant, the exported `<style>` element is also added to the document root.

When the same feature is disabled, its `<style>` element is also removed from the document.

The benefit of using a `styleElement` over a static `stylesheet` is the ability to include CSS constructed at runtime, which is invaluable when considering the generated nature of Tumblr's CSS class names.

This element is never cloned, nor does it ever expire within XKit Rewritten's running lifecycle. Therefore, it is possible to create and export the pointer first, and then construct the CSS later. This is a useful pattern when the CSS the feature wants to construct varies based on the user's preferences.
