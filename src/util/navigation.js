import { inject } from './inject.js';

export const onNavigation = Object.freeze({
  listeners: new Set(),
  addListener (callback) {
    if (this.listeners.has(callback) === false) {
      this.listeners.add(callback);
    }
  },
  removeListener (callback) {
    this.listeners.delete(callback);
  }
});

const waitForNavigation = async () => new Promise(resolve => {
  const navigationHandler = () => {
    window.tumblr.off('navigation', navigationHandler);
    resolve();
  };
  window.tumblr.on('navigation', navigationHandler);
});

let previousLocation = new URL(location);
(async () => {
  while (true) {
    try {
      await inject(waitForNavigation);
    } catch (e) {
      console.log(e);
      break;
    }
    const currentLocation = new URL(location);
    for (const callback of onNavigation.listeners) {
      callback(currentLocation, previousLocation);
    }
    previousLocation = currentLocation;
  }
})();
