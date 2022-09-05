import { keyToCss } from '../util/css_map.js';
import { inject } from '../util/inject.js';
import { registerPostOption, unregisterPostOption } from '../util/post_actions.js';
import { getPreferences } from '../util/preferences.js';

const symbolId = 'ri-timer-flash-line';
let delayMs;

const controlPostFormStatus = (status, publishOn) => {
  const button = document.currentScript.parentElement;
  const reactKey = Object.keys(document.currentScript.parentElement).find(key => key.startsWith('__reactFiber'));

  const isScheduled = status === 'scheduled';
  let fiber = button[reactKey];
  while (fiber !== null) {
    if (fiber.stateNode?.state?.isDatePickerVisible !== undefined) {
      fiber.stateNode.setState({ isDatePickerVisible: isScheduled });
      break;
    } else {
      fiber = fiber.return;
    }
  }

  fiber = button[reactKey];
  while (fiber !== null) {
    if (fiber.stateNode?.setFormPostStatus && fiber.stateNode?.onChangePublishOnValue) {
      fiber.stateNode.setFormPostStatus(status);
      if (publishOn) fiber.stateNode.onChangePublishOnValue(new Date(publishOn));
      break;
    } else {
      fiber = fiber.return;
    }
  }
};

const editPostFormStatus = (status, publishOn) => {
  const button = document.querySelector(`${keyToCss('postFormButton')} button`);
  if (!button) throw new Error('Missing button element to edit post form status');

  inject(controlPostFormStatus, [status, publishOn], button);
};

export const main = async function () {
  const { delaySeconds } = await getPreferences('delay_posting');
  delayMs = (Number(delaySeconds) ?? 0) * 1000;

  registerPostOption('delay-posting', {
    symbolId,
    onclick: () => editPostFormStatus('scheduled', Date.now() + delayMs)
  });
};

export const clean = async function () {
  unregisterPostOption('delay-posting');
};
