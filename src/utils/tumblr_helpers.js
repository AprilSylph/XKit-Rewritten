import { inject } from './inject.js';

/**
 * @typedef {string | number | boolean | null | Json[] | { [key: string]: Json }} Json
 * @see https://www.typescriptlang.org/play/3-7/types-and-code-flow/recursive-type-references.ts.html
 */

/** @typedef {Record<string, Json>} Dictionary */
/** @typedef {Record<string, string>} QueryParams */

/**
 * Perform a Tumblr API request, using the helper supplied by the Tumblr web platform API for third-party extensions.
 * Note: when accessed through the web platform, the Tumblr API occasionally differs slightly from the documentation.
 * @param {globalThis.RequestInit & { queryParams?: QueryParams, body?: (string | Dictionary) }} args Arguments to pass to `window.tumblr.apiFetch()`
 * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#apifetch}
 * @returns {Promise<Response | Error>} Resolves or rejects with result of `window.tumblr.apiFetch()`
 */
export const apiFetch = async (...args) => inject('/main_world/api_fetch.js', args);

/**
 * Create an NPF edit request body.
 * @see https://github.com/tumblr/docs/blob/master/api.md#postspost-id---editing-a-post-neue-post-format
 * @see https://github.com/tumblr/docs/blob/master/api.md#posts---createreblog-a-post-neue-post-format
 * @param {object} postData camelCased /posts/{post-id} GET request response JSON
 * @returns {object} camelCased /posts/{post-id} PUT request body parameters
 */
export const createEditRequestBody = postData => {
  const {
    content,
    layout,
    state,
    publishOn,
    date,
    tags,
    sourceUrl,
    sourceUrlRaw,
    slug,
    interactabilityReblog,

    canBeTipped,
    communityLabels: {
      hasCommunityLabel,
      categories: communityLabelCategories,
    },
  } = postData;

  return {
    content,
    layout,
    state,
    publishOn,
    date,
    tags: tags.join(','),
    sourceUrl: sourceUrlRaw ?? sourceUrl,
    slug,
    interactabilityReblog,

    canBeTipped,
    hasCommunityLabel,
    communityLabelCategories,
  };
};

/**
 * @param {object} postData /posts/{post-id} GET request response JSON
 * @returns {boolean} Whether the post can be edited as NPF
 */
export const isNpfCompatible = postData => {
  const { isBlocksPostFormat, shouldOpenInLegacy } = postData;
  return isBlocksPostFormat || shouldOpenInLegacy === false;
};

/**
 * Perform a "soft" navigation within Tumblr's single-page-application.
 * @see https://github.com/tumblr/docs/blob/master/web-platform.md#navigate
 * @param {string} location Path to navigate to
 * @returns {Promise<void>} Resolves when the navigation has been requested; does _not_ wait for the target route chunk to load
 */
export const navigate = location => inject('/main_world/navigate.js', [location]);

/**
 * A click event handler that can be applied to anchor elements to automate soft navigation.
 * @param {PointerEvent} event Click event object
 */
export const onClickNavigate = event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
    event.stopImmediatePropagation();
    return;
  }

  const href = event.currentTarget.getAttribute('href');
  if (href) {
    event.stopImmediatePropagation();
    event.preventDefault();
    navigate(href);
  }
};
