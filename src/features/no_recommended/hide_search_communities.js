import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';

export const styleElement = buildStyle(`
${keyToCss('typeaheadSection')}:has(> [aria-label="${translate('Suggested communities')}"]) { display: none; }
`);
