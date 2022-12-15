import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { buildStyle, filterPostElements } from '../util/interface.js';
import { onNewPosts } from '../util/mutations.js';
import { timelineObject } from '../util/react_props.js';
import { buildSvg } from '../util/remixicon.js';

const indicatorClass = 'xkit-legacy-post-indicator';
const excludeClass = 'xkit-legacy-post-done';
const includeFiltered = true;

const symbolId = 'ri-archive-fill';

const styleElement = buildStyle(`
.xkit-legacy-post-indicator {
  display: flex;
  align-items: center;

  cursor: help;
}

.xkit-legacy-post-indicator > svg {
  width: 24px;
  height: 24px;

  fill: rgba(var(--black), 0.4);
}
`);

let indicatorTemplate;

const processPosts = postElements =>
  filterPostElements(postElements, { excludeClass, includeFiltered }).forEach(
    async postElement => {
      const { isBlocksPostFormat } = await timelineObject(postElement);

      if (isBlocksPostFormat === false) {
        const rightContent = postElement.querySelector(`header ${keyToCss('rightContent')}`);
        if (!rightContent || rightContent.querySelector(keyToCss('sponsoredContainer'))) {
          return;
        }

        rightContent.before(indicatorTemplate.cloneNode(true));
      }
    }
  );

export const main = async function () {
  document.head.append(styleElement);
  indicatorTemplate = dom(
    'div',
    { class: indicatorClass, title: 'Stored in the legacy post format.' },
    null,
    [buildSvg(symbolId)]
  );
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();
  $(`.${indicatorClass}`).remove();
};