import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
[data-is-contributed-content="true"]:not([data-xkit-themed]) {
  display: flow-root; background-color: rgb(var(--deprecated-accent), 0.07);
}
`);
