import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const footerContentSelector = `article footer ${keyToCss('footerContent')}`;

export const styleElement = buildStyle(`
  ${footerContentSelector} {
    justify-content: flex-end;
    gap: 0;
  }
  ${footerContentSelector} > div {
    display: contents;
  }
  ${footerContentSelector} > div:not(${keyToCss('engagementControls')}) > * {
    position: static;
    order: -1;
  }

  ${footerContentSelector} ${keyToCss('targetWrapperFlex')}:has(use[href="#managed-icon__ds-reblog-24"]) {
    flex: 0;
  }
  ${footerContentSelector} ${keyToCss('engagementCount')} {
    display: none;
  }
`);
