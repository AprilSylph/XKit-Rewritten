import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const rowWithImages = `${keyToCss('rows')}${keyToCss('rows')} ${keyToCss('rowWithImages')}:not(${keyToCss('unstretched')})`;
const imageWithoutRows = `${keyToCss('imageBlock')}${keyToCss('notInRowBasedLayoutNavigationEventsRedesign')}`;
const videoBlock = `${keyToCss('rows')}${keyToCss('rows')} ${keyToCss('videoBlock')}`;

export const styleElement = buildStyle(`
${rowWithImages} {
  padding-inline: unset;
}
${rowWithImages} :is(${keyToCss('imageBlockButton')}, ${keyToCss('imageBlockButton')} img) {
  border-radius: unset !important;
}
${rowWithImages} ${keyToCss('imageBlockButton')}:after {
  border: none !important;
}

${imageWithoutRows} {
  padding-inline: unset;
}
${imageWithoutRows} img {
  border-radius: unset !important;
}
${imageWithoutRows} > div:after {
  border: none !important;
}

${videoBlock} {
  margin-inline: unset;
  width: 100%;
}
${videoBlock} ${keyToCss('videoPlayer', 'embeddedPlayer')} {
  border-radius: 0;
}
`);
