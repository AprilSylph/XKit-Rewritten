import { pageModifications } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { dom } from '../../utils/dom.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { memoize } from '../../utils/memoize.js';

const posterAttribute = 'data-paused-gif-placeholder';
const pausedContentVar = '--xkit-paused-gif-content';
const pausedBackgroundImageVar = '--xkit-paused-gif-background-image';
const loadingBackgroundImageAttribute = 'data-paused-gif-background-loading';
const labelClass = 'xkit-paused-gif-label';
const containerClass = 'xkit-paused-gif-container';

let enabledTimestamp;

const hovered = `:is(
  :hover > *,
  .${containerClass}:hover *,
  ${keyToCss('linkCard')}:hover *,
  a:hover + div > ${keyToCss('communityCategoryImage')},
)`;

export const styleElement = buildStyle(`
.${labelClass} {
  position: absolute;
  top: 1ch;
  right: 1ch;

  height: 1em;
  padding: 0.6ch;
  border-radius: 3px;

  background-color: rgb(var(--black));
  color: rgb(var(--white));
  font-size: 1rem;
  font-weight: bold;
  line-height: 1em;
}

.${labelClass}::before {
  content: "GIF";
}

.${labelClass}.mini {
  font-size: 0.6rem;
}

${keyToCss('blogCard')} ${keyToCss('headerImage')} .${labelClass} {
  font-size: 0.8rem;
  top: calc(140px - 1em - 2.2ch);
}

.${labelClass}${hovered},
${hovered} > .${labelClass}.inside,
img:has(~ [${posterAttribute}]):not(${hovered}),
${keyToCss('loader')}:has(~ .${labelClass}):not(${hovered}) {
  display: none;
}

[${posterAttribute}]:not(${hovered}) {
  visibility: visible !important;
}

img[style*="${pausedContentVar}"]:not(${hovered}) {
  content: var(${pausedContentVar});
}
[style*="${pausedBackgroundImageVar}"]:not(${hovered}) {
  background-image: var(${pausedBackgroundImageVar}) !important;
}

[${loadingBackgroundImageAttribute}]:not(:hover)::before {
  content: "";
  backdrop-filter: blur(40px);
  position: absolute;
  inset: 0;
  z-index: -1;
}
[${loadingBackgroundImageAttribute}]:not(:hover) {
  contain: paint;
}
`);

const addLabel = (element, inside = false) => {
  const target = inside ? element : element.parentNode;

  if (target && target.querySelector(`.${labelClass}`) === null) {
    const gifLabel = dom('p', { class: labelClass });
    element.clientWidth && element.clientWidth <= 150 && gifLabel.classList.add('mini');
    inside && gifLabel.classList.add('inside');

    target.append(gifLabel);
  }
};

const createPausedUrl = memoize(async sourceUrl => {
  const response = await fetch(sourceUrl, { headers: { Accept: 'image/webp,*/*' } });
  const contentType = response.headers.get('Content-Type');
  const canvas = document.createElement('canvas');

  /* globals ImageDecoder */
  if (typeof ImageDecoder === 'function' && await ImageDecoder.isTypeSupported(contentType)) {
    const decoder = new ImageDecoder({
      type: contentType,
      data: response.body,
      preferAnimation: true
    });
    const { image: videoFrame } = await decoder.decode();
    if (!decoder.tracks.selectedTrack.animated) {
      // source image is not animated; decline to pause it
      return undefined;
    }
    canvas.width = videoFrame.displayWidth;
    canvas.height = videoFrame.displayHeight;
    canvas.getContext('2d').drawImage(videoFrame, 0, 0);
  } else {
    const imageBitmap = await response.blob().then(window.createImageBitmap);
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
  }
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 1));
  return URL.createObjectURL(blob);
});

const loaded = gifElement =>
  (gifElement.complete && gifElement.currentSrc) ||
  new Promise(resolve => gifElement.addEventListener('load', resolve, { once: true }));

const pauseGifWithPoster = async function (gifElement, posterElement) {
  addLabel(gifElement);
  await loaded(gifElement); // skip this to delay gif loading until the user hovers
  posterElement.setAttribute(posterAttribute, '');
};

const pauseGif = async function (gifElement) {
  await loaded(gifElement);
  const pausedUrl = await createPausedUrl(gifElement.currentSrc);
  if (!pausedUrl) return;

  gifElement.style.setProperty(pausedContentVar, `url(${pausedUrl})`);
  addLabel(gifElement);
};

const processGifs = function (gifElements) {
  gifElements.forEach(gifElement => {
    if (!gifElement.matches('[srcset*=".gif"], [src*=".gif"], [srcset*=".webp"], [src*=".webp"]')) return;
    if (gifElement.closest('.block-editor-writing-flow')) return;
    const existingLabelElements = gifElement.parentNode.querySelectorAll(`.${labelClass}`);
    gifElement.parentNode.append(...existingLabelElements);

    gifElement.decoding = 'sync';

    const posterElement = gifElement.parentElement.querySelector(keyToCss('poster'));
    posterElement?.currentSrc
      ? pauseGifWithPoster(gifElement, posterElement)
      : pauseGif(gifElement);
  });
};

const sourceUrlRegex = /(?<=url\(["'])[^)]*?\.(?:gif|gifv|webp)(?=["']\))/g;
const processBackgroundGifs = function (gifBackgroundElements) {
  gifBackgroundElements.forEach(async gifBackgroundElement => {
    // tumblr tv 'videoHubCardWrapper' video cards may be initially rendered with the wrong background
    if (!gifBackgroundElement.matches('[style*=".gif"], [style*=".webp"]')) await new Promise(requestAnimationFrame);
    if (!gifBackgroundElement.matches('[style*=".gif"], [style*=".webp"]')) return;

    const sourceValue = gifBackgroundElement.style.backgroundImage;
    const sourceUrl = sourceValue.match(sourceUrlRegex)?.[0];
    if (!sourceUrl) return;

    Date.now() - enabledTimestamp >= 100 && gifBackgroundElement.setAttribute(loadingBackgroundImageAttribute, '');
    const pausedUrl = await createPausedUrl(sourceUrl);
    gifBackgroundElement.removeAttribute(loadingBackgroundImageAttribute);

    if (!pausedUrl) return;

    gifBackgroundElement.style.setProperty(
      pausedBackgroundImageVar,
      sourceValue.replaceAll(sourceUrlRegex, pausedUrl)
    );
    addLabel(gifBackgroundElement, true);
  });
};

const processRows = function (rowsElements) {
  rowsElements.forEach(rowsElement => {
    [...rowsElement.children].forEach(row => {
      if (!row.querySelector('figure')) return;

      if (row.previousElementSibling?.classList?.contains(containerClass)) {
        row.previousElementSibling.append(row);
      } else {
        const wrapper = dom('div', { class: containerClass });
        row.replaceWith(wrapper);
        wrapper.append(row);
      }
    });
  });
};

export const main = async function () {
  enabledTimestamp = Date.now();

  const gifImage = `
    :is(
      figure, /* post image/imageset; blog view sidebar "more like this"; post in grid view; blog card modal post entry */
      main.labs, /* labs settings header: https://www.tumblr.com/settings/labs */
      ${keyToCss(
        'linkCard', // post link element
        'typeaheadRow', // modal search dropdown entry
        'tagImage', // search page sidebar related tags, recommended tag carousels: https://www.tumblr.com/search/gif, https://www.tumblr.com/explore/recommended-for-you
        'headerBanner', // blog view header
        'headerImage', // modal blog card header
        'topPost', // activity page top post
        'videoHubsFeatured', // tumblr tv recommended card: https://www.tumblr.com/dashboard/tumblr_tv
        'takeoverBanner' // advertisement
      )}
    ) img:not(${keyToCss('poster')})
  `;
  pageModifications.register(gifImage, processGifs);

  const gifBackgroundImage = keyToCss(
    'communityHeaderImage', // search page tags section header: https://www.tumblr.com/search/gif?v=tag
    'bannerImage', // tagged page sidebar header: https://www.tumblr.com/tagged/gif
    'tagChicletWrapper', // "trending" / "your tags" timeline carousel entry: https://www.tumblr.com/dashboard/trending, https://www.tumblr.com/dashboard/hubs
    'communityCategoryImage', // tumblr communities browse page entry: https://www.tumblr.com/communities/browse
    'videoHubCardWrapper' // tumblr tv channels section: https://www.tumblr.com/dashboard/tumblr_tv
  );
  pageModifications.register(gifBackgroundImage, processBackgroundGifs);

  pageModifications.register(
    `:is(${postSelector}, ${keyToCss('blockEditorContainer')}) ${keyToCss('rows')}`,
    processRows
  );
};

export const clean = async function () {
  pageModifications.unregister(processGifs);
  pageModifications.unregister(processBackgroundGifs);
  pageModifications.unregister(processRows);

  [...document.querySelectorAll(`.${containerClass}`)].forEach(wrapper =>
    wrapper.replaceWith(...wrapper.children)
  );

  $(`.${labelClass}`).remove();
  [...document.querySelectorAll(`img[style*="${pausedContentVar}"]`)]
    .forEach(element => element.style.removeProperty(pausedContentVar));
  [...document.querySelectorAll(`img[style*="${pausedBackgroundImageVar}"]`)]
    .forEach(element => element.style.removeProperty(pausedBackgroundImageVar));
  $(`[${loadingBackgroundImageAttribute}]`).removeAttr(loadingBackgroundImageAttribute);
};
