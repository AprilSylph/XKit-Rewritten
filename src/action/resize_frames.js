const resizeObserverCallback = () => {
  const { height } = document.documentElement.getBoundingClientRect();
  window.frameElement.height = Math.ceil(height);
};

const observer = new ResizeObserver(resizeObserverCallback);
observer.observe(document.documentElement);
