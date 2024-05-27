import { keyToCss } from '../../utils/css_map.js';
import { pageModifications } from '../../utils/mutations.js';

const tagChicletVideoSelector = `${keyToCss('tagChicletWrapper')} > video`;

const processTagChicletVideos = videos =>
  videos.forEach(video => {
    video.pause();
    video.currentTime = 0;
  });

export const main = async () => {
  pageModifications.register(tagChicletVideoSelector, processTagChicletVideos);
};

export const clean = async () => {
  pageModifications.unregister(processTagChicletVideos);
  [...document.querySelectorAll(tagChicletVideoSelector)].forEach(video => video.play());
};
