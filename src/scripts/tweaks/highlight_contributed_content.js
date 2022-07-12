import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle('[data-is-contributed-content="true"] { overflow-y: hidden; background-color: rgb(var(--follow)); }');

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
