const className = 'accesskit-normal-width-scrollbar';

export const main = async () => {
  document.documentElement.classList.add(className);
  document.body.classList.add(className);
  document.documentElement.append(styleElement);
};
export const clean = async () => {
  document.documentElement.classList.remove(className);
  document.body.classList.remove(className);
  styleElement.remove();
};
