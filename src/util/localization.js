/**
 * Returns the message in its localized format. Essentially an alias
 * for the *.i18n.getBrowser method, but it performs the check for
 * Chromium vs Firefox internally.
 *
 * @param {string} messageId - Identifier for the string
 * @param {string} defaultMessage - Message to use if the browser can't be identified.
 * @returns {string} Either the localization for the messageId if the browser can be identified, otherwise the defaultMessage.
 */
export function getLocalizedMessage (messageId, defaultMessage) {
  if (typeof chrome !== 'undefined') {
    // Could be either Chrome or Firefox
    if (typeof browser !== 'undefined') {
      // Confirmed to be Firefox. Use browser.
      return browser.i18n.getMessage(messageId);
    }
    // Must be Chrome. Use chrome.
    return chrome.i18n.getMessage(messageId);
  } else if (typeof browser !== 'undefined') {
    // Must be Edge. Use browser.
    return browser.i18n.getMessage(messageId);
  }
  // Unknown browser. Return the default message.
  return defaultMessage;
}

/**
 * Attempts to pull the localization for an HTML element according to
 * an assigned attribute.
 *
 * @param {Element} el - Target element to localize
 */
export function localizeHtml (el) {
  if (el.hasAttribute('contentI18nKey')) {
    const localContentKey = el.getAttribute('contentI18nKey');
    el.innerText = getLocalizedMessage(localContentKey, el.innerText);
  }
  if (el.hasAttribute('placeholderI18nKey')) {
    const localPlaceholderKey = el.getAttribute('placeholderI18nKey');
    const placeholderLocal = getLocalizedMessage(localPlaceholderKey, el.getAttribute('placeholder'));
    el.setAttribute('placeholder', placeholderLocal);
  }
}