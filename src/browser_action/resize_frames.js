const callback = () => { window.frameElement.height = document.documentElement.scrollHeight + 1; };
const observer = new ResizeObserver(callback);

callback();
observer.observe(document.documentElement);
