import { pageModifications } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { dom } from '../../utils/dom.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { getPreferences } from '../../utils/preferences.js';
import { memoize } from '../../utils/memoize.js';

const pausedPosterAttribute = 'data-paused-gif-use-poster';
const pausedContentVar = '--xkit-paused-gif-content';
const pausedBackgroundImageVar = '--xkit-paused-gif-background-image';
const hoverContainerAttribute = 'data-paused-gif-hover-container';
const labelAttribute = 'data-paused-gif-label';
const hoverFixAttribute = 'data-paused-gif-hover-fix';
const containerClass = 'xkit-paused-gif-container';

let loadingMode;

const hovered = `:is(:hover, [${hoverContainerAttribute}]:hover *)`;

export const styleElement = buildStyle(`
[${labelAttribute}]::after {
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
[${labelAttribute}="mini"]::after {
  font-size: 0.6rem;
}

[${labelAttribute}="hr"]::after {
  font-size: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
}

[${labelAttribute}]${hovered}::after,
[${pausedPosterAttribute}]:not(${hovered}) > div > ${keyToCss('knightRiderLoader')} {
  display: none;
}

${keyToCss('blogCard')} ${keyToCss('headerImage')}${keyToCss('small')}[${labelAttribute}]::after {
  font-size: 0.8rem;
  top: calc(140px - 1em - 2.2ch);
}

img:is([${pausedPosterAttribute}], [style*="${pausedContentVar}"]):not(${hovered}) ~ div > ${keyToCss('knightRiderLoader')} {
  display: none;
}
${keyToCss('background')}[${labelAttribute}]::after {
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

img[style*="${pausedContentVar}"]:not(${hovered}) {
  content: var(${pausedContentVar});
}
[style*="${pausedBackgroundImageVar}"]:not(${hovered}) {
  background-image: var(${pausedBackgroundImageVar}) !important;
}

[${hoverFixAttribute}] {
  position: relative;
  pointer-events: auto !important;
}
`);

const addLabel = (element, inside = false) => {
  const target = inside ? element : element.parentElement;
  if (target && getComputedStyle(target, '::after').content === 'none') {
    target.setAttribute(labelAttribute, '');

    target.clientWidth && target.clientWidth <= 150 && target.setAttribute(labelAttribute, 'mini');
    target.clientHeight && target.clientHeight <= 50 && target.setAttribute(labelAttribute, 'mini');
    target.clientHeight && target.clientHeight <= 30 && target.setAttribute(labelAttribute, 'hr');
  }
};

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

const processGifs = function (gifElements) {
  gifElements.forEach(async gifElement => {
    if (gifElement.closest(`${keyToCss('avatarImage', 'subAvatarImage')}, .block-editor-writing-flow`)) return;
    gifElement.decoding = 'sync';

    const posterElement = gifElement.parentElement.querySelector(keyToCss('poster'));
    if (posterElement) {
      gifElement.parentElement.setAttribute(pausedPosterAttribute, loadingMode);
    } else {
      const sourceUrl = gifElement.currentSrc ||
        await new Promise(resolve => gifElement.addEventListener('load', () => resolve(gifElement.currentSrc), { once: true }));

      gifElement.style.setProperty(pausedContentVar, 'linear-gradient(transparent, transparent)');
      const pausedUrl = await createPausedUrlIfAnimated(sourceUrl).catch(() => undefined);
      if (!pausedUrl) {
        gifElement.style.removeProperty(pausedContentVar);
        return;
      }

      gifElement.style.setProperty(pausedContentVar, `url(${pausedUrl})`);
    }
    addLabel(gifElement);

    gifElement.closest(keyToCss(
      'albumImage', // post audio element
      'imgLink' // trending tag: https://www.tumblr.com/explore/trending
    ))?.setAttribute(hoverFixAttribute, '');
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

    gifBackgroundElement.closest(keyToCss(
      'media', // old activity item: "liked your post", "reblogged your post", "mentioned you in a post"
      'activityMedia' // new activity item: "replied to your post", "replied to you in a post"
    ))?.setAttribute(hoverFixAttribute, '');
  });
};

const processRows = function (rowsElements) {
  rowsElements.forEach(rowsElement => {
    [...rowsElement.children].forEach(row => {
      if (!row.querySelector(`figure:not(${keyToCss('unstretched')})`)) return;

      if (row.previousElementSibling?.classList?.contains(containerClass)) {
        row.previousElementSibling.append(row);
      } else {
        const wrapper = dom('div', { class: containerClass, [hoverContainerAttribute]: '' });
        row.replaceWith(wrapper);
        wrapper.append(row);
      }
    });
  });
};

const processHoverableElements = elements =>
  elements.forEach(element => element.setAttribute(hoverContainerAttribute, ''));

const onStorageChanged = async function (changes, areaName) {
  if (areaName !== 'local') return;

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
      ${
        'main.labs' // labs settings header: https://www.tumblr.com/settings/labs
      },
      ${keyToCss(
        'linkCard', // post link element
        'albumImage', // post audio element
        'messageImage', // direct message attached image
        'messagePost', // direct message linked post
        'typeaheadRow', // modal search dropdown entry
        'tagImage', // search page sidebar related tags, recommended tag carousel entry: https://www.tumblr.com/search/gif, https://www.tumblr.com/explore/recommended-for-you
        'headerBanner', // blog view header
        'headerImage', // modal blog card header, activity page "biggest fans" header
        'topPost', // activity page top post
        'colorfulListItemWrapper', // trending tag: https://www.tumblr.com/explore/trending
        'takeoverBanner' // advertisement
      )}
    ) img:is([srcset*=".gif"], [src*=".gif"], [srcset*=".webp"], [src*=".webp"]):not(${keyToCss('poster')})
  `;
  pageModifications.register(gifImage, processGifs);

  const gifBackgroundImage = `
    ${keyToCss(
      'media', // old activity item: "liked your post", "reblogged your post", "mentioned you in a post"
      'activityMedia', // new activity item: "replied to your post", "replied to you in a post"
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
    `${keyToCss('gridTimelineObject')}` // likes page or patio grid view post: https://www.tumblr.com/likes
  ].join(', ');
  pageModifications.register(hoverableElement, processHoverableElements);

  pageModifications.register(
    `:is(${postSelector}, ${keyToCss('blockEditorContainer')}) ${keyToCss('rows')}`,
    processRows
  );

  browser.storage.onChanged.addListener(onStorageChanged);
};

export const clean = async function () {
  browser.storage.onChanged.removeListener(onStorageChanged);

  pageModifications.unregister(processGifs);
  pageModifications.unregister(processBackgroundGifs);
  pageModifications.unregister(processRows);
  pageModifications.unregister(processHoverableElements);

  [...document.querySelectorAll(`.${containerClass}`)].forEach(wrapper =>
    wrapper.replaceWith(...wrapper.children)
  );

  $(`[${labelAttribute}]`).removeAttr(labelAttribute);
  $(`[${pausedPosterAttribute}]`).removeAttr(pausedPosterAttribute);
  $(`[${hoverContainerAttribute}]`).removeAttr(hoverContainerAttribute);
  $(`[${hoverFixAttribute}]`).removeAttr(hoverFixAttribute);
  [...document.querySelectorAll(`img[style*="${pausedContentVar}"]`)]
    .forEach(element => element.style.removeProperty(pausedContentVar));
  [...document.querySelectorAll(`[style*="${pausedBackgroundImageVar}"]`)]
    .forEach(element => element.style.removeProperty(pausedBackgroundImageVar));
};
