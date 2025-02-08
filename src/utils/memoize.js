export const memoize = (func) => {
  const cache = new Map();
  return (arg) => {
    if (!cache.has(arg)) {
      cache.set(arg, func(arg));
    }
    return cache.get(arg);
  };
};

export const weakMemoize = (func) => {
  const cache = new WeakMap();
  return (arg) => {
    if (!cache.has(arg)) {
      cache.set(arg, func(arg));
    }
    return cache.get(arg);
  };
};
