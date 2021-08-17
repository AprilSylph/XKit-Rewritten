/**
 * Fetch the SVG belonging to a specific RemixIcon.
 *
 * @param {string} cssClass - The RemixIcon class of the requested icon
 * @returns {Promise<string|undefined>} The SVG path of the associated RemixIcon if it exists
 */
export const getIconPath = async function (cssClass) {
  const url = browser.runtime.getURL('/lib/remixicon_svg.json');
  const file = await fetch(url);
  const icons = await file.json();

  return icons[cssClass];
};

/**
 * Create a button template that can be cloned with cloneControlButton() for inserting into the controls of a post.
 *
 * @param {string} iconClass - The RemixIcon class of the requested icon
 * @param {string} buttonClass - An extra class to identify the extension that added the button
 * @returns {Promise<HTMLDivElement>} A button that can be cloned with cloneControlButton()
 */
export const createControlButtonTemplate = async function (iconClass, buttonClass) {
  const controlButtonContainer = document.createElement('div');
  controlButtonContainer.classList.add('xkit-control-button-container', buttonClass);

  const controlButton = document.createElement('button');
  controlButton.classList.add('xkit-control-button');
  controlButtonContainer.appendChild(controlButton);

  const controlButtonInner = document.createElement('span');
  controlButtonInner.classList.add('xkit-control-button-inner');
  controlButtonInner.tabIndex = -1;
  controlButton.appendChild(controlButtonInner);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '2 2 20 20');
  svg.setAttribute('width', '21');
  svg.setAttribute('height', '21');
  svg.setAttribute('fill', 'rgba(var(--black), 0.65)');
  controlButtonInner.appendChild(svg);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const icon = await getIconPath(iconClass);
  path.setAttribute('d', icon);
  svg.appendChild(path);

  return controlButtonContainer;
};

/**
 * Create a deep-level clone of a button template that is ready to add to the page
 *
 * @param {HTMLDivElement} template - A button template as returned by createControlButtonTemplate()
 * @param {object} events - An object of DOM Event names and handler functions,
 *                          e.g. { click: () => { alert('Hello!'); } }
 * @returns {HTMLDivElement} A clone of the button template, with the specified event handlers attached
 */
export const cloneControlButton = function (template, events) {
  const newButton = template.cloneNode(true);
  Object.entries(events).forEach(([type, listener]) => newButton.addEventListener(type, listener));
  return newButton;
};
