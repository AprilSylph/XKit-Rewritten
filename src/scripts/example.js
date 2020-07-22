(function() {
  const hello = "world";

  const main = async function() {
    console.log(`Hello, ${hello}!`);
  }

  const clean = async function() {

  }

  const stylesheet = '/src/scripts/example.css';

  return { main, clean, stylesheet };
})();
