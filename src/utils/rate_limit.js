/**
 * Creates a function for rate limiting a task, with support for coordinating between browser tabs.
 * The returned function should be called as a necessary condition for running a task. It will return true only if the task has not been run recently within a specified interval. Thus, tasks contingent upon the function will only execute as frequently as the specified interval.
 * If configured, the function will only return true if the task has not been run in another browser tab running the same code within an increased interval. Thus, tasks contingent upon the function will only execute in **any** tab as frequently as the specified interval.
 * @param {object} options Destructured
 * @param {string} options.id Identifier for this rate limit instance
 * @param {boolean} options.multiTab Whether to coordinate between browser tabs.
 * @returns {(interval: number) => boolean} A function that returns true if it has not been called in the last `interval` milliseconds.
 */
export const createRateLimitFunction = ({ id, multiTab }) => {
  let lastRun = 0;
  let lastRunInOtherTab = 0;
  let channel;

  if (multiTab) {
    channel = new BroadcastChannel(`xkit-multi-tab-rate-limit-${id}`);
    channel.addEventListener('message', () => { lastRunInOtherTab = Date.now(); });
  }

  return function shouldRunTask (interval) {
    const now = Date.now();
    const timeSinceThisTabRun = now - lastRun;
    const timeSinceOtherTabRun = now - lastRunInOtherTab;

    // Higher delay before taking over from another executing tab than before repeating execution in current tab makes multi tab execution prioritize one tab when called frequently, minimizing race condition risk.
    const minimumDelay = interval * 0.9;
    const otherTabMinimumDelay = minimumDelay * 2;

    if (timeSinceThisTabRun < minimumDelay) {
      console.info(
        `XKit Rewritten: skipping ${id.slice(0, 17)} task; this tab ran it ${timeSinceThisTabRun}ms ago`,
      );
      return false;
    }
    if (timeSinceOtherTabRun < otherTabMinimumDelay) {
      console.info(
        `XKit Rewritten: skipping ${id.slice(0, 17)} task; another tab ran it ${timeSinceOtherTabRun}ms ago`,
      );
      return false;
    }
    channel?.postMessage(true);
    lastRun = Date.now();
    return true;
  };
};
