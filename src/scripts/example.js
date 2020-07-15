(function() { // this file is for reference only; to see it work, you must manually set enabledScripts in xkit.js/init()
  const hello = "world";

  const main = async function() {
    console.log(`Hello, ${hello}!`);
  }

  const clean = async function() {

  }

  const stylesheet = '/src/scripts/example.css';

  return { main, clean, stylesheet };
})();
