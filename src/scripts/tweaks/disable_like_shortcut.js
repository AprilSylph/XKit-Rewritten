const stopLKey = event => {
  if (event.code === 'KeyL') {
    event.stopPropagation();
  }
};

export const main = async () => document.body.addEventListener('keydown', stopLKey);
export const clean = async () => document.body.removeEventListener('keydown', stopLKey);
