import { keyToCss } from '../../util/css_map.js';
import { postSelector, buildStyle } from '../../util/interface.js';

const filteredScreenSelector = `${postSelector}:not(${keyToCss('masonryTimelineObject')}) ${keyToCss('filteredScreen')}`;

const styleElement = buildStyle(`
  ${filteredScreenSelector} {
    flex-direction: row;
    justify-content: space-between;
    overflow-x: auto;
    height: auto;
    padding-top: var(--post-header-vertical-padding);
    padding-bottom: var(--post-header-vertical-padding);
  }

  ${filteredScreenSelector} > p {
    flex-shrink: 0;
  }

  ${filteredScreenSelector} > a {
    overflow: hidden;
    margin-right: auto;
    margin-left: 1ch;

    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ${filteredScreenSelector} > button {
    flex-shrink: 0;
    margin-left: 1ch;
  }

  ${filteredScreenSelector} > button > span {
    margin-top: 0;
  }
`);

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
