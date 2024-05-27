import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle('[data-is-contributed-content="true"] { display: flow-root; background-color: rgb(var(--follow)); }');

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
