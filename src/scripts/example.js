(function() { // this file is for reference only; to see it work, you must manually set enabledScripts in xkit.js/init()
  const hello = "world";

  const main = async function() {
    console.log(`Hello, ${hello}!`);
    debugger;
  }

  return { main };
})();
