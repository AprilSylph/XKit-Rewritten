import { keyToCss } from '../../utils/css_map.js';
import { postSelector, buildStyle } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';

const tagsAttribute = 'data-filtered-post-show-tags';

const filteredScreenSelector = `${postSelector} ${keyToCss('filteredScreen')}`;

export const styleElement = buildStyle(`
[${tagsAttribute}]:has(> ${keyToCss('filteredScreen')})::after {
  content: attr(${tagsAttribute});

  display: block;
  padding: var(--post-padding);
  padding-top: 0;

  font-size: 0.9em;
  line-height: normal;
  white-space: pre-wrap;
  background-color: rgba(var(--black), 0.07);
  color: rgba(var(--black), 0.65);
}
`);

export const main = async () =>
  pageModifications.register(filteredScreenSelector, filteredScreens =>
    filteredScreens.forEach(async filteredScreen => {
      const { tags } = await timelineObject(filteredScreen);
      if (tags.length) {
        filteredScreen.parentElement.setAttribute(tagsAttribute, tags.map(tag => `#${tag}`).join(' '.repeat(3)));
      }
    })
  );

export const clean = () => $(`[${tagsAttribute}]`).removeAttr(tagsAttribute);
