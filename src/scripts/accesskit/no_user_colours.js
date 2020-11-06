(function () {
  const className = 'accesskit-no-user-colours';

  const main = async () => document.body.classList.add(className);
  const clean = async () => document.body.classList.remove(className);

  return { main, clean };
})();
