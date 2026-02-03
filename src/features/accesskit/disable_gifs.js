import { pageModifications } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { canvas, div } from '../../utils/dom.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { getPreferences } from '../../utils/preferences.js';
import { memoize } from '../../utils/memoize.js';

const canvasClass = 'xkit-paused-gif-placeholder';
const pausedPosterAttribute = 'data-paused-gif-use-poster';
const pausedBackgroundImageVar = '--xkit-paused-gif-background-image';
const hoverContainerAttribute = 'data-paused-gif-hover-container';
const labelAttribute = 'data-paused-gif-label';
const labelSizeAttribute = 'data-paused-gif-label-size';
const containerClass = 'xkit-paused-gif-container';

let loadingMode;

const hovered = `:is(:hover, [${hoverContainerAttribute}]:hover *)`;
const parentHovered = `:is(:hover > *, [${hoverContainerAttribute}]:hover *)`;

export const styleElement = buildStyle(`
[${labelAttribute}="after"]::after,
[${labelAttribute}="before"]::before {
  position: absolute;
  top: 1ch;
  right: 1ch;

  height: 1em;
  padding: 0.6ch;
  border-radius: 3px;

  content: "GIF";
  background-color: rgb(var(--black));
  color: rgb(var(--white));
  font-size: 1rem;
  font-weight: bold;
  line-height: 1em;
  pointer-events: none;
}
[${labelAttribute}="before"]::before {
  z-index: 1;
}
[${labelSizeAttribute}="mini"][${labelAttribute}="after"]::after,
[${labelSizeAttribute}="mini"][${labelAttribute}="before"]::before {
  font-size: 0.6rem;
}
[${labelSizeAttribute}="hr"][${labelAttribute}="after"]::after,
[${labelSizeAttribute}="hr"][${labelAttribute}="before"]::before {

  font-size: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
}

.${canvasClass} {
  position: absolute;
  visibility: visible;
  top: 0;
  left: 0;

  background-color: rgb(var(--white));
}

.${canvasClass}${parentHovered},
[${labelAttribute}="after"]${hovered}::after,
[${labelAttribute}="before"]${hovered}::before,
[${pausedPosterAttribute}]:not(${hovered}) > div > ${keyToCss('knightRiderLoader')} {
  display: none !important;
}
${keyToCss('background')}[${labelAttribute}="after"]::after,
${keyToCss('background')}[${labelAttribute}="before"]::before {
  /* prevent double labels in recommended post cards */
  display: none;
}

[${pausedPosterAttribute}]:not(${hovered}) > img${keyToCss('poster')} {
  visibility: visible !important;
}
[${pausedPosterAttribute}="eager"]:not(${hovered}) > img:not(${keyToCss('poster')}) {
  visibility: hidden !important;
}
[${pausedPosterAttribute}="lazy"]:not(${hovered}) > img:not(${keyToCss('poster')}) {
  display: none;
}

[style*="${pausedBackgroundImageVar}"]:not(${hovered}) {
  background-image: var(${pausedBackgroundImageVar}) !important;
}
`);

const addLabel = (element, inside = false) => {
  const target = inside ? element : element.parentElement;
  if (target) {
    const mode =
      getComputedStyle(target, '::after').content === 'none'
        ? 'after'
        : getComputedStyle(target, '::before').content === 'none'
          ? 'before'
          : 'invalid';

    target.setAttribute(labelAttribute, mode);

    target.clientWidth && target.clientWidth <= 150 && target.setAttribute(labelSizeAttribute, 'mini');
    target.clientHeight && target.clientHeight <= 50 && target.setAttribute(labelSizeAttribute, 'mini');
    target.clientHeight && target.clientHeight <= 30 && target.setAttribute(labelSizeAttribute, 'hr');
  }
};

/**
 * Fetches the selected image and tests if it is animated. On older browsers without ImageDecoder
 * support, GIF images are assumed to be animated and WebP images are assumed to not be animated.
 */
const isAnimated = memoize(async sourceUrl => {
  const response = await fetch(sourceUrl, { headers: { Accept: 'image/webp,*/*' } });
  const contentType = response.headers.get('Content-Type');

  if (typeof ImageDecoder === 'function' && await ImageDecoder.isTypeSupported(contentType)) {
    const decoder = new ImageDecoder({
      type: contentType,
      data: response.body,
      preferAnimation: true
    });
    await decoder.decode();
    return decoder.tracks.selectedTrack.animated;
  } else {
    return !sourceUrl.endsWith('.webp');
  }
});

/**
 * Fetches the selected image, tests if it is animated, and returns a blob URL with the paused image
 * if it is. This may be a small memory or storage leak, as the resulting blob URL will be valid until
 * the page is refreshed/closed; avoid using this where practical. On older browsers without ImageDecoder
 * support, GIF images are assumed to be animated and WebP images are assumed to not be animated.
 */
const createPausedUrlIfAnimated = memoize(async sourceUrl => {
  const response = await fetch(sourceUrl, { headers: { Accept: 'image/webp,*/*' } });
  const contentType = response.headers.get('Content-Type');
  const canvas = document.createElement('canvas');

  if (typeof ImageDecoder === 'function' && await ImageDecoder.isTypeSupported(contentType)) {
    const decoder = new ImageDecoder({
      type: contentType,
      data: response.body,
      preferAnimation: true
    });
    const { image: videoFrame } = await decoder.decode();
    if (decoder.tracks.selectedTrack.animated === false) {
      // source image is not animated; decline to pause it
      return undefined;
    }
    canvas.width = videoFrame.displayWidth;
    canvas.height = videoFrame.displayHeight;
    canvas.getContext('2d').drawImage(videoFrame, 0, 0);
  } else {
    if (sourceUrl.endsWith('.webp')) {
      // source image may not be animated; decline to pause it
      return undefined;
    }
    const imageBitmap = await response.blob().then(blob => window.createImageBitmap(blob));
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
  }
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 1));
  return URL.createObjectURL(blob);
});

const pauseGif = async function (gifElement) {
  if (gifElement.currentSrc.endsWith('.webp') && !(await isAnimated(gifElement.currentSrc))) return;

  const image = new Image();
  image.src = gifElement.currentSrc;
  image.onload = () => {
    if (gifElement.parentNode && gifElement.parentNode.querySelector(`.${canvasClass}`) === null) {
      const canvasElement = canvas({
        width: image.naturalWidth,
        height: image.naturalHeight,
        class: `${gifElement.className} ${canvasClass}`,
        style: gifElement.getAttribute('style')
      });
      canvasElement.getContext('2d').drawImage(image, 0, 0);
      gifElement.after(canvasElement);
      addLabel(gifElement);
    }
  };
};

const processGifs = function (gifElements) {
  gifElements.forEach(gifElement => {
    if (gifElement.closest(`${keyToCss('avatarImage', 'subAvatarImage')}, .block-editor-writing-flow`)) return;
    const pausedGifElements = [...gifElement.parentNode.querySelectorAll(`.${canvasClass}`)];
    if (pausedGifElements.length) {
      gifElement.after(...pausedGifElements);
      return;
    }

    gifElement.decoding = 'sync';

    const posterElement = gifElement.parentElement.querySelector(keyToCss('poster'));
    if (posterElement) {
      gifElement.parentElement.setAttribute(pausedPosterAttribute, loadingMode);
      addLabel(posterElement);
      return;
    }

    if (gifElement.complete && gifElement.currentSrc) {
      pauseGif(gifElement);
    } else {
      gifElement.onload = () => pauseGif(gifElement);
    }
  });
};

const sourceUrlRegex = /url\(["'][^)]*?\.(?:gif|gifv|webp)["']\)/g;
const processBackgroundGifs = function (gifBackgroundElements) {
  gifBackgroundElements.forEach(async gifBackgroundElement => {
    const sourceValue = gifBackgroundElement.style.backgroundImage;
    const sourceUrl = sourceValue.match(sourceUrlRegex)?.[0];
    if (!sourceUrl) return;

    gifBackgroundElement.style.setProperty(
      pausedBackgroundImageVar,
      sourceValue.replace(sourceUrlRegex, 'linear-gradient(transparent, transparent)')
    );
    const pausedUrl = await createPausedUrlIfAnimated(
      sourceUrl.replace(/^url\(["']/, '').replace(/["']\)$/, '')
    ).catch(() => undefined);
    if (!pausedUrl) {
      gifBackgroundElement.style.removeProperty(pausedBackgroundImageVar);
      return;
    }

    gifBackgroundElement.style.setProperty(
      pausedBackgroundImageVar,
      sourceValue.replace(sourceUrlRegex, `url("${pausedUrl}")`)
    );
    addLabel(gifBackgroundElement, true);
  });
};

const processRows = function (rowsElements) {
  rowsElements.forEach(rowsElement => {
    [...rowsElement.children].forEach(row => {
      if (!row.querySelector(`figure:not(${keyToCss('unstretched')})`)) return;

      if (row.previousElementSibling?.classList?.contains(containerClass)) {
        row.previousElementSibling.append(row);
      } else {
        const wrapper = div({ class: containerClass, [hoverContainerAttribute]: '' });
        row.replaceWith(wrapper);
        wrapper.append(row);
      }
    });
  });
};

const processHoverableElements = elements =>
  elements.forEach(element => element.setAttribute(hoverContainerAttribute, ''));

const onStorageChanged = async function (changes) {
  const { 'accesskit.preferences.disable_gifs_loading_mode': modeChanges } = changes;
  if (modeChanges?.oldValue === undefined) return;

  loadingMode = modeChanges.newValue;
};

export const main = async function () {
  ({ disable_gifs_loading_mode: loadingMode } = await getPreferences('accesskit'));

  const gifImage = `
    :is(
      ${
        'figure' // post image/imageset; recommended blog carousel entry; blog view sidebar "more like this"; post in grid view; blog card modal post entry
      },
      ${keyToCss(
        'linkCard', // post link element
        'messageImage', // direct message attached image
        'messagePost', // direct message linked post
        'typeaheadRow', // modal search dropdown entry
        'tagImage', // search page sidebar related tags, recommended tag carousel entry: https://www.tumblr.com/search/gif, https://www.tumblr.com/explore/recommended-for-you
        'topPost', // activity page top post
        'takeoverBanner', // advertisement
        'mrecContainer' // advertisement
      )}
    ) img:is([srcset*=".gif"], [src*=".gif"], [srcset*=".webp"], [src*=".webp"]):not(${keyToCss('poster')})
  `;
  pageModifications.register(gifImage, processGifs);

  const gifBackgroundImage = `
    ${keyToCss(
      'communityHeaderImage', // search page tags section header: https://www.tumblr.com/search/gif?v=tag
      'bannerImage', // tagged page sidebar header: https://www.tumblr.com/tagged/gif
      'tagChicletWrapper', // "trending" / "your tags" timeline carousel entry: https://www.tumblr.com/dashboard/trending, https://www.tumblr.com/dashboard/hubs
      'communityCategoryImage' // tumblr communities browse page entry: https://www.tumblr.com/communities/browse, https://www.tumblr.com/communities/browse/movies
    )}:is([style*=".gif"], [style*=".webp"])
  `;
  pageModifications.register(gifBackgroundImage, processBackgroundGifs);

  const hoverableElement = [
    `${keyToCss('listTimelineObject')} ${keyToCss('carouselWrapper')} ${keyToCss('postCard')}`, // recommended blog carousel entry
    `div:has(> a${keyToCss('cover')}):has(${keyToCss('communityCategoryImage')})`, // tumblr communities browse page entry: https://www.tumblr.com/communities/browse
  ].join(', ');
  pageModifications.register(hoverableElement, processHoverableElements);

  pageModifications.register(
    `:is(${postSelector}, ${keyToCss('blockEditorContainer')}) ${keyToCss('rows')}`,
    processRows
  );

  browser.storage.local.onChanged.addListener(onStorageChanged);
};

export const clean = async function () {
  browser.storage.local.onChanged.removeListener(onStorageChanged);

  pageModifications.unregister(processGifs);
  pageModifications.unregister(processBackgroundGifs);
  pageModifications.unregister(processRows);
  pageModifications.unregister(processHoverableElements);

  [...document.querySelectorAll(`.${containerClass}`)].forEach(wrapper =>
    wrapper.replaceWith(...wrapper.children)
  );

  $(`.${canvasClass}`).remove();
  $(`[${labelAttribute}]`).removeAttr(labelAttribute);
  $(`[${labelSizeAttribute}]`).removeAttr(labelSizeAttribute);
  $(`[${pausedPosterAttribute}]`).removeAttr(pausedPosterAttribute);
  $(`[${hoverContainerAttribute}]`).removeAttr(hoverContainerAttribute);
  [...document.querySelectorAll(`[style*="${pausedBackgroundImageVar}"]`)]
    .forEach(element => element.style.removeProperty(pausedBackgroundImageVar));
};
