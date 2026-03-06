/**
 * Disables a UI element while an asynchronous process is pending.
 * @param {HTMLElement} element Element to disable
 * @param {Promise<any>|() => any} value Promise or async function
 * @returns {Promise<any>} Promise resolution value or callback function return value
 */
export const disableWhileProcessing = async (element, value) => {
  try {
    element.disabled = true;
    return await (typeof value === 'function' ? value() : value);
  } finally {
    element.disabled = false;
  }
};
