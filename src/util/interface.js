(function() {
  /**
   * @param {String} css - CSS rules to be applied to the page
   */
  const addStyle = css => {
    const style = document.createElement('style');
    style.classList.add('xkit');
    style.textContent = css;
    document.documentElement.appendChild(style);
  };

  /**
   * @param {String} css - CSS rules to remove from the page
   *                       (must match a string previously passed to addStyle)
   */
  const removeStyle = css => {
    [...document.querySelectorAll('style.xkit')]
    .filter(style => style.textContent === css)
    .forEach(style => style.parentNode.removeChild(style));
  };

  return { addStyle, removeStyle };
})();
