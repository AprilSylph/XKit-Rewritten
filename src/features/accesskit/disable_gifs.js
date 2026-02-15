import { keyToCss } from '../../utils/css_map.js';
import { canvas, div } from '../../utils/dom.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { memoize } from '../../utils/memoize.js';
import { pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';

const canvasClass = 'xkit-paused-gif-placeholder';
const pausedPosterAttribute = 'data-paused-gif-use-poster';
const hoverContainerAttribute = 'data-paused-gif-hover-container';
const labelAttribute = 'data-paused-gif-label';
const labelSizeAttribute = 'data-paused-gif-label-size';
const containerClass = 'xkit-paused-gif-container';
const backgroundGifClass = 'xkit-paused-background-gif';

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

.${backgroundGifClass}:not(:hover) {
  background-image: none !important;
  background-color: rgb(var(--secondary-accent));
}

.${backgroundGifClass}:not(:hover) > :is(div, span) {
  color: rgb(var(--black));
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
      preferAnimation: true,
    });
    await decoder.decode();
    return decoder.tracks.selectedTrack.animated;
  } else {
    return !sourceUrl.endsWith('.webp');
  }
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
        style: gifElement.getAttribute('style'),
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

const processBackgroundGifs = function (gifBackgroundElements) {
  gifBackgroundElements.forEach(gifBackgroundElement => {
    gifBackgroundElement.classList.add(backgroundGifClass);
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
        'mrecContainer', // advertisement
      )}
    ) img:is([srcset*=".gif"], [src*=".gif"], [srcset*=".webp"], [src*=".webp"]):not(${keyToCss('poster')})
  `;
  pageModifications.register(gifImage, processGifs);

  const gifBackgroundImage = `
    ${keyToCss(
      'communityHeaderImage', // search page tags section header: https://www.tumblr.com/search/gif?v=tag
      'bannerImage', // tagged page sidebar header: https://www.tumblr.com/tagged/gif
      'tagChicletWrapper', // "trending" / "your tags" timeline carousel entry: https://www.tumblr.com/dashboard/trending, https://www.tumblr.com/dashboard/hubs
    )}[style*=".gif"]
  `;
  pageModifications.register(gifBackgroundImage, processBackgroundGifs);

  pageModifications.register(
    `${keyToCss('listTimelineObject')} ${keyToCss('carouselWrapper')} ${keyToCss('postCard')}`, // recommended blog carousel entry: https://www.tumblr.com/tagged/gif
    processHoverableElements,
  );

  pageModifications.register(
    `:is(${postSelector}, ${keyToCss('blockEditorContainer')}) ${keyToCss('rows')}`,
    processRows,
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
    wrapper.replaceWith(...wrapper.children),
  );

  $(`.${canvasClass}`).remove();
  $(`.${backgroundGifClass}`).removeClass(backgroundGifClass);
  $(`[${labelAttribute}]`).removeAttr(labelAttribute);
  $(`[${labelSizeAttribute}]`).removeAttr(labelSizeAttribute);
  $(`[${pausedPosterAttribute}]`).removeAttr(pausedPosterAttribute);
  $(`[${hoverContainerAttribute}]`).removeAttr(hoverContainerAttribute);
};
