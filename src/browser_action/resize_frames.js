// @ts-ignore
const callback = () => { window.frameElement.height = document.documentElement.scrollHeight; };
const observer = new ResizeObserver(callback);

callback();
observer.observe(document.documentElement);
