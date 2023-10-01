import { getRandomHexString } from './crypto.js';
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

const eventName = `xkit-navigation-${getRandomHexString()}`;

addEventListener(eventName, () =>
  onNavigation.listeners.forEach(callback => callback())
);

inject(
  eventName => window.tumblr.on('navigation', () => dispatchEvent(new CustomEvent(eventName))),
  [eventName]
);
