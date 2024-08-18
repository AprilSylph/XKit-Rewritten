# Feature modules

Modules may export any of the following:

## `main()`
- Type: Async Function
- Required: No

The main function of the feature. Will be called whenever the user enables the feature, even if the tab(s) XKit is running in is/are not focused. Will also be called upon pageload if the script is enabled.

## `clean()`
- Type: Async Function
- Required: No

The cleanup function of the feature. Called whenever the user disables the feature, also regardless of tab focus.

## `onStorageChanged()`
- Type: Async Function
- Required: No

The preference-handling code of the feature. Added as a `browser.storage.onChanged` listener when the feature is enabled, and removed when the feature is disabled. If the module does not export this function, the feature will be automatically restarted when its preferences are changed.

## `stylesheet`
- Type: Boolean
- Required: No

Whether the feature has a static stylesheet. If true, there should be a `.css` file of matching name in the same directory level. The stylesheet is automatically added and removed during the feature's lifecycle.

## `styleElement`
- Type: HTMLStyleElement
- Required: No

An HTML `<style>` element containing computed and/or dynamic styles, as created by the `buildStyle` utility function. The element is automatically added to the document root and removed during the feature's lifecycle.
