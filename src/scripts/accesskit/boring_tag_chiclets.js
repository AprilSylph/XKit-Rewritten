import { keyToCss } from '../../util/css_map.js';
import { pageModifications } from '../../util/mutations.js';

const processtagChicletVideos = videos => videos.forEach(video => video.pause());

export const main = async () =>
  pageModifications.register(`${keyToCss('tagChicletWrapper')} > video`, processtagChicletVideos);

export const clean = async () => pageModifications.unregister(processtagChicletVideos);
