import { inject } from '../util/inject.js';
import { registerPostOption, unregisterPostOption } from '../util/post_actions.js';
import { getPreferences } from '../util/preferences.js';

const symbolId = 'ri-timer-flash-line';
let delayMs;

const editPostSchedule = publishOnMs => {
  const selectedTagsElement = document.getElementById('selected-tags');
  if (!selectedTagsElement) return;

  const reactKey = Object.keys(selectedTagsElement).find(key => key.startsWith('__reactFiber'));
  let fiber = selectedTagsElement[reactKey];

  while (fiber !== null) {
    if (fiber.stateNode?.setFormPostStatus && fiber.stateNode?.onChangePublishOnValue) {
      fiber.stateNode.setFormPostStatus('scheduled');
      fiber.stateNode.onChangePublishOnValue(new Date(publishOnMs));
      break;
    } else {
      fiber = fiber.return;
    }
  }
};

export const main = async function () {
  const { delaySeconds } = await getPreferences('delay_posting');
  delayMs = (Number(delaySeconds) ?? 0) * 1000;

  registerPostOption('delay-posting', {
    symbolId,
    onclick: () => inject(editPostSchedule, [Date.now() + delayMs])
  });
};

export const clean = async function () {
  unregisterPostOption('delay-posting');
};
