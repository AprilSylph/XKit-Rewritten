const className = 'accesskit-no-user-colours';

export const main = async () => document.body.classList.add(className);
export const clean = async () => document.body.classList.remove(className);
