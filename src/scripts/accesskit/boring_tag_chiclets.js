import { keyToCss } from '../../util/css_map.js';
import { pageModifications } from '../../util/mutations.js';

const processTagChicletVideos = videos => videos.forEach(video => video.pause());

export const main = async () =>
  pageModifications.register(`${keyToCss('tagChicletWrapper')} > video`, processTagChicletVideos);

export const clean = async () => pageModifications.unregister(processTagChicletVideos);
