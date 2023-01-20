import { notify } from '../util/notifications.js';
import { getPreferences } from '../util/preferences.js';

let $cat;
let timeoutId;

export const main = async function () {
  const { appearance, fixed, stayAway } = await getPreferences('xneko');

  const centerX = $(window).width() / 2 - 16;
  const centerY = $(window).height() / 2 - 16;

  $cat = $('<div id="xneko-rewritten">&nbsp;</div>');
  $cat.addClass(appearance);
  if (fixed) {
    $cat.addClass('fixed');
  }

  let mouseX = centerX;
  let mouseY = centerY;

  let x = centerX;
  let y = centerY;
  let stopped = true;
  let energy = 100;
  let standCount = 0;
  let sleeping = false;
  let directionX = 0; // -1 left | 0 middle | 1 right
  let directionY = 0; // -1 top  | 0 middle | 1 bottom
  let altSprite = false;

  const placeCat = (xInput, yInput) => {
    x = xInput;
    y = yInput;
    $cat.css('top', Math.round(yInput) + 'px');
    $cat.css('left', Math.round(xInput) + 'px');
  };

  placeCat(centerX, centerY);

  const setSprite = (row, column) => $cat.css('background-position', `${32 * row}px -${32 * column}px`);

  const think = () => {
    clearTimeout(timeoutId);

    const deltaX = mouseX - x;
    if (Math.abs(deltaX) < (stayAway ? 40 : 15)) {
      directionX = 0;
    } else {
      directionX = Math.sign(deltaX);
    }

    const deltaY = mouseY - y;
    if (Math.abs(deltaY) < 15) {
      directionY = 0;
    } else {
      directionY = Math.sign(deltaY);
    }

    const shouldStop = directionX === 0 && directionY === 0;

    stopped = false;

    if (directionX === 1) {
      if (directionY === 1) {
        setSprite(altSprite ? 1 : 0, 12);
      }
      if (directionY === 0) {
        setSprite(altSprite ? 1 : 0, 13);
      }
      if (directionY === -1) {
        setSprite(altSprite ? 1 : 0, 14);
      }
    }

    if (directionX === 0) {
      if (directionY === 1) {
        setSprite(altSprite ? 1 : 0, 11);
      }
      if (directionY === 0) {
        setSprite(0, 3);
      }
      if (directionY === -1) {
        setSprite(altSprite ? 1 : 0, 15);
      }
    }

    if (directionX === -1) {
      if (directionY === 1) {
        setSprite(altSprite ? 1 : 0, 10);
      }
      if (directionY === 0) {
        setSprite(altSprite ? 1 : 0, 9);
      }
      if (directionY === -1) {
        setSprite(altSprite ? 1 : 0, 8);
      }
    }

    // Alternate between sprites.
    altSprite = !altSprite;

    let interval = 520;

    if (energy === 0 || sleeping) {
      // cat needs sleep!
      sleeping = true;
      energy += 30;

      if (energy >= 100) {
        if (stopped === false) {
          sleeping = false;
        }
        energy = 100;
      }

      standCount = 0;

      setSprite(altSprite === false ? 1 : 0, 1);
    } else {
      if (shouldStop === false) {
        if (stopped === true) {
          stopped = false;
          setSprite(1, 0);
          energy -= 1;
          interval = 320;
        } else {
          placeCat(x + 8 * directionX, y + 8 * directionY);
          energy -= 1;
          standCount = 0;
          interval = 100;
        }
      } else {
        if (stopped === true) {
          setSprite(1, 3);
          sleeping = true;
        }

        stopped = true;
        energy = energy - 1;
        standCount = standCount + 1;

        if (standCount === 5 || standCount === 7) {
          setSprite(1, 2);
        }

        if (standCount === 4 || standCount === 6) {
          setSprite(0, 2);
        }

        if (standCount === 12 || standCount === 14) {
          setSprite(1, 6);
        }

        if (standCount === 13 || standCount === 15) {
          setSprite(0, 6);
        }

        if (standCount === 15 || standCount === 30) {
          setSprite(1, 3);
        }
      }
    }

    timeoutId = setTimeout(think, interval);
  };

  $('body').append($cat);

  $cat.click(() => {
    notify('Meow!');
    mouseX += 60;
    energy += 60;
    think(true);
  });

  $(document).mousemove((e) => {
    if (fixed) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    } else {
      mouseX = e.pageX;
      mouseY = e.pageY;
    }

    if (stayAway) {
      mouseX -= 15;
      mouseY -= 15;
    }
  });

  timeoutId = setTimeout(think, 200);
};

export const clean = async function () {
  clearTimeout(timeoutId);
  $cat.remove();
};

export const stylesheet = true;
