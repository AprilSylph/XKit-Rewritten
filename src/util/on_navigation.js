import { inject } from './inject.js';

export const onNavigation = Object.freeze({
  listeners: new Set(),
  register (callback) {
    this.listeners.add(callback);
  },
  unregister (callback) {
    this.listeners.delete(callback);
  }
});

addEventListener('navigation', () =>
  onNavigation.listeners.forEach(callback => callback())
);

inject(() =>
  window.tumblr.on('navigation', () => dispatchEvent(new CustomEvent('navigation')))
);
