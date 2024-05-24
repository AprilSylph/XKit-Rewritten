import { buildStyle } from '../../util/interface.js';

export const styleElement = buildStyle(`
[data-is-contributed-content="true"] {
  display: flow-root; background-color: rgb(var(--follow));
}
`);
