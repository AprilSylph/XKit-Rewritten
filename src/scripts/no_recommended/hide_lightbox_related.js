import { descendantSelector } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  const flexLayoutSelector = await descendantSelector('glass', 'flexLayout');
  const mainSectionSelector = await descendantSelector('glass', 'flexLayout', 'mainSection');
  const relatedPostsSectionSelector = await descendantSelector('glass', 'flexLayout', 'relatedPostsSection');

  styleElement.textContent = `
    ${flexLayoutSelector} { align-items: center; justify-content: center; margin-top: 0; }
    ${mainSectionSelector} { height: unset; margin: auto; }
    ${relatedPostsSectionSelector} { display: none; }
  `;

  document.head.append(styleElement);
};

export const clean = async () => styleElement.remove();
