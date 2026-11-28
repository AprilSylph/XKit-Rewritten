export default function getRunningXkitVersion (currentVersion) {
  const runningVersion = window.xkitRewrittenVersion;
  Object.defineProperty(window, 'xkitRewrittenVersion', {
    value: currentVersion,
    writable: false,
    enumerable: false,
    configurable: true,
  });
  return runningVersion;
}
