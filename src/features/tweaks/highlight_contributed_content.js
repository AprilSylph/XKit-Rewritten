import { buildStyle } from '../../utils/interface.js';

export const styleElement = buildStyle(`
[data-is-contributed-content="true"] {
  display: flow-root; background-color: rgb(var(--deprecated-accent), 0.07);
}
:has(+ [data-is-contributed-content="true"]) {
  display: flow-root; background-color: rgb(var(--blue), 0.07);
})
`);
