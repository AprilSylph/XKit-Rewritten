export default eventName =>
  window.tumblr.on('navigation', () => dispatchEvent(new CustomEvent(eventName)));
