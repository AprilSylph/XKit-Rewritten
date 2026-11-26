/**
 * This module is run in the page's "main" execution environment.
 * It receives function call request events from the inject utility,
 * loads and executes the requested functions, and sends back the results.
 */

/** @type {Map<string, { default(): object | void | Promise<object | void> }>} */
const moduleCache = new Map();
const moduleLoaders = {
  '/main_world/api_fetch.js': () => import('./api_fetch.js'),
  '/main_world/closest_rendered_element.js': () => import('./closest_rendered_element.js'),
  '/main_world/control_tags_input.js': () => import('./control_tags_input.js'),
  '/main_world/css_map.js': () => import('./css_map.js'),
  '/main_world/edit_timeline_object.js': () => import('./edit_timeline_object.js'),
  '/main_world/get_notification_props.js': () => import('./get_notification_props.js'),
  '/main_world/get_tumblelogname_prop.js': () => import('./get_tumblelogname_prop.js'),
  '/main_world/language_data.js': () => import('./language_data.js'),
  '/main_world/navigate.js': () => import('./navigate.js'),
  '/main_world/post_request.js': () => import('./post_request.js'),
  '/main_world/unbury_blog.js': () => import('./unbury_blog.js'),
  '/main_world/unbury_mobile_badge_data.js': () => import('./unbury_mobile_badge_data.js'),
  '/main_world/unbury_notification.js': () => import('./unbury_notification.js'),
  '/main_world/unbury_timeline_object.js': () => import('./unbury_timeline_object.js'),
  '/main_world/unbury_trail_item.js': () => import('./unbury_trail_item.js'),
  '/main_world/update_bottom_sheet_container_height.js': () => import('./update_bottom_sheet_container_height.js'),
};

// Remove outdated event listeners when loading module
window.removeXKitListener?.();

const controller = new AbortController();
window.removeXKitListener = () => controller.abort();

document.documentElement.addEventListener('xkit-injection-request', async event => {
  const { detail, target } = event;
  const { id, url, args } = JSON.parse(detail);

  try {
    const { pathname } = new URL(url);
    const moduleLoader = moduleLoaders[pathname];
    if (!moduleLoader) throw new RangeError(`Unrecognised module path: ${pathname}`);

    if (!moduleCache.has(pathname)) moduleCache.set(pathname, await moduleLoader());
    const func = moduleCache.get(pathname).default;

    if (target.isConnected === false) return;

    const result = await func.apply(target, args);

    if (result instanceof Element) {
      result.dispatchEvent(
        new CustomEvent('xkit-injection-element-response', { detail: JSON.stringify({ id }), bubbles: true }),
      );
    } else {
      document.documentElement.dispatchEvent(
        new CustomEvent('xkit-injection-response', { detail: JSON.stringify({ id, result }) }),
      );
    }
  } catch (exception) {
    target.dispatchEvent(
      new CustomEvent('xkit-injection-response', {
        detail: JSON.stringify({
          id,
          exception: {
            message: exception.message,
            name: exception.name,
            stack: exception.stack,
            ...exception,
          },
        }),
      }),
    );
  }
}, { signal: controller.signal });

document.documentElement.dispatchEvent(new CustomEvent('xkit-injection-ready'));
