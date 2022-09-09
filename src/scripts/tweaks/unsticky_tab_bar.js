import { keyToCss } from '../../util/css_map.js';
import { inject } from '../../util/inject.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
  ${keyToCss('tabsHeader')} { position: static; transform: none; }
  ${keyToCss('post')} ${keyToCss('stickyContainer')} > ${keyToCss('avatar')} { top: 69px !important; }
`);

const removeScrollHandler = () => {
  const bluespaceLayout = document.currentScript.parentElement;
  const reactKey = Object.keys(bluespaceLayout).find(key => key.startsWith('__reactFiber'));
  let fiber = bluespaceLayout[reactKey];

  while (fiber !== null) {
    if (fiber.stateNode?.onScroll !== undefined) {
      const onScroll = fiber.stateNode.onScroll;
      window.removeEventListener('scroll', onScroll);
      return;
    } else {
      fiber = fiber.return;
    }
  }
};

export const main = async () => {
  document.head.append(styleElement);
  inject(removeScrollHandler, [], document.querySelector(keyToCss('bluespaceLayout')));
};
export const clean = async () => styleElement.remove();
