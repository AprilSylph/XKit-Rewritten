import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const flexLayoutSelector = `${keyToCss('glass')} ${keyToCss('flexLayout')}`;
const mainSectionSelector = `${flexLayoutSelector} > ${keyToCss('mainSection')}`;
const relatedPostsSectionSelector = `${flexLayoutSelector} > ${keyToCss('relatedPostsSection')}`;

export const styleElement = buildStyle(`
${flexLayoutSelector} { align-items: center; justify-content: center; margin-top: 0; }
${mainSectionSelector} { height: unset; margin: auto; }
${relatedPostsSectionSelector} { display: none; }
`);
