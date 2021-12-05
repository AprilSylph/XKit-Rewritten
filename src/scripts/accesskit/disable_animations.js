const className = 'accesskit-disable-animations';

export const main = async () => document.body.classList.add(className);
export const clean = async () => document.body.classList.remove(className);
