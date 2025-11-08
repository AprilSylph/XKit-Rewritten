import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const rowWithImages = `${keyToCss('rows')}${keyToCss('rows')} ${keyToCss('rowWithImages')}`;
const videoBlock = `${keyToCss('rows')}${keyToCss('rows')} ${keyToCss('videoBlock')}`;

export const styleElement = buildStyle(`
${rowWithImages}  {
  padding-inline: unset;
}
${rowWithImages} ${keyToCss('imageBlock')}${keyToCss('unstretched')} {
  padding-inline: 12px;
}
${rowWithImages} :is(${keyToCss('imageBlockButton')}, ${keyToCss('imageBlockButton')} img) {
  border-radius: unset !important;
}
${rowWithImages} ${keyToCss('imageBlockButton')}:after {
  border: none !important;
}

${rowWithImages} :is(
  ${keyToCss('imageBlock')}${keyToCss('unstretched')},
  ${keyToCss('imageBlock')}${keyToCss('unstretched')} img,
  ${keyToCss('imageBlock')}${keyToCss('unstretched')} > div
) {
  border-radius: unset !important;
}
${rowWithImages} ${keyToCss('imageBlock')}${keyToCss('unstretched')} > div:after {
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
