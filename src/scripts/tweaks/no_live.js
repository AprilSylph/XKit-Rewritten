import { pageModifications } from '../../util/mutations.js';
import { buildStyle, getTimelineItemWrapper } from '../../util/interface.js';
import { keyToCss } from '../../util/css_map.js';

const hiddenAttribute = 'data-tweaks-no-live-hidden';
const styleElement = buildStyle(`[${hiddenAttribute}] > * { display: none; }`);

const processFrames = frames =>
  frames.forEach(frame =>
    getTimelineItemWrapper(frame).setAttribute(hiddenAttribute, '')
  );

export const main = async function () {
  pageModifications.register(
    `:is(iframe[src^="https://api.gateway.tumblr-live.com/"], ${keyToCss('liveMarqueeContainer', 'liveMarqueeTitle')})`,
    processFrames
  );
  document.documentElement.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(processFrames);
  styleElement.remove();

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
