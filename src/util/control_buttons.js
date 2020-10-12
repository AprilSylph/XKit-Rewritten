(function () {
  /**
   * Fetch the SVG belonging to a specific RemixIcon.
   *
   * @param {string} cssClass - The RemixIcon class of the requested icon
   * @returns {string|undefined} The SVG path of the associated RemixIcon if it exists
   */
  const getIconPath = async function (cssClass) {
    const url = browser.runtime.getURL('/lib/remixicon_svg.json');
    const file = await fetch(url);
    const icons = await file.json();

    if (Object.prototype.hasOwnProperty.call(icons, cssClass)) {
      return `<path d="${icons[cssClass]}"/>`;
    }
  };

  /**
   * Create a button template that can be cloned with cloneControlButton() for inserting into the controls of a post.
   *
   * @param {string} iconClass - The RemixIcon class of the requested icon
   * @param {string} buttonClass - An extra class to identify the extension that added the button
   * @returns {HTMLDivElement} A button that can be cloned with cloneControlButton()
   */
  const createControlButtonTemplate = async function (iconClass, buttonClass) {
    const controlButtonContainer = document.createElement('div');
    controlButtonContainer.classList.add('xkit-control-button-container', buttonClass);

    const controlButtonContainerSpan = document.createElement('span');
    controlButtonContainerSpan.classList.add('xkit-control-button-container-span');

    const controlButton = document.createElement('button');
    controlButton.classList.add('xkit-control-button');
    controlButton.tabIndex = 0;

    const controlButtonInner = document.createElement('span');
    controlButtonInner.classList.add('xkit-control-button-inner');
    controlButtonInner.tabIndex = -1;
    const iconPath = await getIconPath(iconClass);
    controlButtonInner.innerHTML = `<svg viewBox="2 2 20 20" width="21" height="21" fill="var(--gray-65)">${iconPath}</svg>`;

    controlButton.appendChild(controlButtonInner);
    controlButtonContainerSpan.appendChild(controlButton);
    controlButtonContainer.appendChild(controlButtonContainerSpan);

    return controlButtonContainer;
  };

  /**
   * Create a deep-level clone of a button template that is ready to add to the page
   *
   * @param {HTMLDivElement} template - A button template as returned by createControlButtonTemplate()
   * @param {Function} callback - A function to run when the button is clicked
   * @returns {HTMLDivElement} A clone of the template with a click handler attached
   */
  const cloneControlButton = function (template, callback) {
    const newButton = template.cloneNode(true);
    newButton.querySelector('button').addEventListener('click', callback);
    return newButton;
  };

  return { getIconPath, createControlButtonTemplate, cloneControlButton };
})();
