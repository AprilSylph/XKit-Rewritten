import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

const rowWithImages = `${keyToCss('rows')}${keyToCss('rows')} ${keyToCss('rowWithImages')}`;
const imageWithoutRows = `${keyToCss('imageBlock')}${keyToCss('notInRowBasedLayoutNavigationEventsRedesign')}`;
const videoBlock = `${keyToCss('rows')}${keyToCss('rows')} ${keyToCss('videoBlock')}`;
const audioBlock = `${keyToCss('rows')}${keyToCss('rows')} ${keyToCss('audioBlock')}`;

const aspectRatioVar = '--xkit-full-width-media-aspect-ratio';

export const styleElement = buildStyle(`
${rowWithImages} {
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
${videoBlock} iframe[style*="${aspectRatioVar}"] {
  aspect-ratio: var(${aspectRatioVar});
  height: unset !important;
  max-width: unset !important;
}

${audioBlock} {
  padding-inline: unset;
  width: 100%;
}
${audioBlock} ${keyToCss('nativePlayer', 'embedWrapper', 'embedIframe')}{
  border-radius: 0;
}
`);

const processVideoIframes = iframes => iframes.forEach(iframe => {
  const { maxWidth, height } = iframe.style;
  if (maxWidth && height) {
    iframe.style.setProperty(
      aspectRatioVar,
      `${maxWidth.replace('px', '')} / ${height.replace('px', '')}`
    );
  }
});

export const main = async () => {
  pageModifications.register(`${videoBlock} iframe[style*="max-width"][style*="height"]`, processVideoIframes);
};

export const clean = async () => {
  pageModifications.unregister(processVideoIframes);
  [...document.querySelectorAll(`iframe[style*="${aspectRatioVar}"]`)].forEach(el =>
    el.style.removeProperty(aspectRatioVar)
  );
};
