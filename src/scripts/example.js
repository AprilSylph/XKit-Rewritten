(function() {
  const main = async function() {
    const {'example.preferences': preferences = {}} = await browser.storage.local.get('example.preferences');

    const {log = true} = preferences;
    const {whatToLog = 'world'} = preferences;
    const {level = 'log'} = preferences;

    if (log === true) {
      console[level](`Hello, ${whatToLog}!`);
    }
  }

  const clean = async function() {

  }

  const stylesheet = '/src/scripts/example.css';

  return { main, clean, stylesheet };
})();
