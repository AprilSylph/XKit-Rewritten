import { pageModifications } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { dom } from '../../utils/dom.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { memoize } from '../../utils/memoize.js';

const posterAttribute = 'data-paused-gif-placeholder';
const pausedContentVar = '--xkit-paused-gif-content';
const pausedBackgroundImageVar = '--xkit-paused-gif-background-image';
const hoverContainerAttribute = 'data-paused-gif-hover-container';
const hoverFixAttribute = 'data-paused-gif-hover-fix';
const labelClass = 'xkit-paused-gif-label';
const containerClass = 'xkit-paused-gif-container';

const hovered = `:is(:hover > *, [${hoverContainerAttribute}]:hover *)`;

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
${keyToCss('blogCard')} ${keyToCss('headerImage')}${keyToCss('small')} .${labelClass} {
  font-size: 0.8rem;
  top: calc(140px - 1em - 2.2ch);
}

.${labelClass}${hovered},
img:is([${posterAttribute}], [style*="${pausedContentVar}"]):not(${hovered}) ~ div > ${keyToCss('knightRiderLoader')} {
  display: none;
}
${keyToCss('background')} > .${labelClass} {
  /* prevent double labels in recommended post cards */
  display: none;
}

[${posterAttribute}]:not(${hovered}) {
  visibility: visible !important;
}
img:has(~ [${posterAttribute}]:not(${hovered})) {
  visibility: hidden !important;
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
  if (target) {
    [...target.querySelectorAll(`.${labelClass}`)].forEach(existingLabel => existingLabel.remove());

    const gifLabel = document.createElement('p');
    gifLabel.className = target.clientWidth && target.clientWidth <= 150
      ? `${labelClass} mini`
      : labelClass;

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
    if (gifElement.closest('.block-editor-writing-flow')) return;

    const posterElement = gifElement.parentElement.querySelector(keyToCss('poster'));
    if (posterElement) {
      posterElement.setAttribute(posterAttribute, '');
    } else {
      const sourceUrl = gifElement.currentSrc ||
        await new Promise(resolve => gifElement.addEventListener('load', () => resolve(gifElement.currentSrc), { once: true }));

      const pausedUrl = await createPausedUrl(sourceUrl);
      if (!pausedUrl) return;

      gifElement.style.setProperty(pausedContentVar, `url(${pausedUrl})`);
    }
    addLabel(gifElement);
    gifElement.decoding = 'sync';

    gifElement.closest(keyToCss(
      'albumImage', // post audio element
      'imgLink' // trending tag: https://www.tumblr.com/explore/trending
    ))?.setAttribute(hoverFixAttribute, '');
  });
};

const sourceUrlRegex = /(?<=url\(["'])[^)]*?\.(?:gif|gifv|webp)(?=["']\))/g;
const processBackgroundGifs = function (gifBackgroundElements) {
  gifBackgroundElements.forEach(async gifBackgroundElement => {
    const sourceValue = gifBackgroundElement.style.backgroundImage;
    const sourceUrl = sourceValue.match(sourceUrlRegex)?.[0];
    if (!sourceUrl) return;

    const pausedUrl = await createPausedUrl(sourceUrl);
    if (!pausedUrl) return;

    gifBackgroundElement.style.setProperty(
      pausedBackgroundImageVar,
      sourceValue.replaceAll(sourceUrlRegex, pausedUrl)
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
      if (!row.querySelector('figure')) return;

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

export const main = async function () {
  const gifImage = `
    :is(
      figure, /* post image/imageset; recommended blog carousel entry; blog view sidebar "more like this"; post in grid view; blog card modal post entry */
      main.labs, /* labs settings header: https://www.tumblr.com/settings/labs */
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
        'videoHubsFeatured', // tumblr tv recommended card: https://www.tumblr.com/dashboard/tumblr_tv
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
      'communityCategoryImage', // tumblr communities browse page entry: https://www.tumblr.com/communities/browse, https://www.tumblr.com/communities/browse/movies
      'videoHubCardWrapper' // tumblr tv channels section: https://www.tumblr.com/dashboard/tumblr_tv
    )}:is([style*=".gif"], [style*=".webp"])
  `;
  pageModifications.register(gifBackgroundImage, processBackgroundGifs);

  const hoverableElement = `
    ${keyToCss('listTimelineObject')} ${keyToCss('carouselWrapper')} ${keyToCss('postCard')}, /* recommended blog carousel entry */
    div:has(> a${keyToCss('cover')}):has(${keyToCss('communityCategoryImage')}), /* tumblr communities browse page entry: https://www.tumblr.com/communities/browse */
    ${keyToCss('linkCard')} ${keyToCss('withImage')}, /* post link element */
    ${keyToCss(
      'gridTimelineObject', // likes page or patio grid view post: https://www.tumblr.com/likes
      'videoHubsFeatured' // tumblr tv recommended card: https://www.tumblr.com/dashboard/tumblr_tv
    )}
  `;
  pageModifications.register(hoverableElement, processHoverableElements);

  pageModifications.register(
    `:is(${postSelector}, ${keyToCss('blockEditorContainer')}) ${keyToCss('rows')}`,
    processRows
  );
};

export const clean = async function () {
  pageModifications.unregister(processGifs);
  pageModifications.unregister(processBackgroundGifs);
  pageModifications.unregister(processRows);
  pageModifications.unregister(processHoverableElements);

  [...document.querySelectorAll(`.${containerClass}`)].forEach(wrapper =>
    wrapper.replaceWith(...wrapper.children)
  );

  $(`.${labelClass}`).remove();
  $(`[${posterAttribute}]`).removeAttr(posterAttribute);
  $(`[${hoverContainerAttribute}]`).removeAttr(hoverContainerAttribute);
  $(`[${hoverFixAttribute}]`).removeAttr(hoverFixAttribute);
  [...document.querySelectorAll(`img[style*="${pausedContentVar}"]`)]
    .forEach(element => element.style.removeProperty(pausedContentVar));
  [...document.querySelectorAll(`[style*="${pausedBackgroundImageVar}"]`)]
    .forEach(element => element.style.removeProperty(pausedBackgroundImageVar));
};
