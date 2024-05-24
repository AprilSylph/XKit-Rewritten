import { buildStyle } from '../../util/interface.js';

export const styleElement = buildStyle(`
article span[style^="color"] {
  color: inherit !important;
}
`);
