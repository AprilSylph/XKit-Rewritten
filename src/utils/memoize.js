/**
 * Create a version of a function that returns results for repeated calls with
 * the same argument from a cache, improving performance.
 * @template T, R
 * @param {function(T): R} func A function with one argument
 * @returns {function(T): R} A memoized version of the function
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
