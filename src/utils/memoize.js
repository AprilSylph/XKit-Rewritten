/**
 * Create a version of a function that returns results for repeated calls with the same argument from a cache, improving performance.
 * @template {function (T): R} Callback, T, R
 * @param {Callback} func A function with one argument
 * @returns {Callback} A memoized version of the function
 */
export const memoize = (func) => {
  const cache = new Map();
  return (arg) => {
    if (!cache.has(arg)) {
      cache.set(arg, func(arg));
    }
    return cache.get(arg);
  };
};
