(function() {
  const main = async function() {
    $('#base-container').on('click', 'a[role="link"][target="_blank"]', event => event.stopPropagation());
  };

  const clean = async function() {
    $('#base-container').off('click', 'a[role="link"][target="_blank"]');
  };

  return { main, clean };
})();
