import { registerPostOption, unregisterPostOption } from '../util/post_actions.js';
import { getPreferences } from '../util/preferences.js';
import { editPostFormStatus } from '../util/react_props.js';

const symbolId = 'ri-timer-flash-line';
let delayMs;

export const main = async function () {
  const { delaySeconds } = await getPreferences('delay_posting');
  delayMs = (Number(delaySeconds) ?? 0) * 1000;

  registerPostOption('delay-posting', {
    symbolId,
    onclick: () => editPostFormStatus('scheduled', new Date(Date.now() + delayMs))
  });
};

export const clean = async function () {
  unregisterPostOption('delay-posting');
};
