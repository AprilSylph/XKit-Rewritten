import { addStyle, removeStyle } from '../../util/interface.js';

const css = '[data-is-contributed-content="true"] { border-bottom: 1px solid transparent; background-color: rgb(var(--follow)); }';

export const main = async () => addStyle(css);
export const clean = async () => removeStyle(css);
