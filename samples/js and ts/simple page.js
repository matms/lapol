
// You must define a function that takes in a single parameter, the loader.
async function load(loader) {
    // console.log("\n====== HELLO FROM simple page.js ======\n")

    // You can use the loader object to load the desired things.
    // See the ModuleLoader documentation for more details on the available methods.
    loader.declareRequire("std:main");
    loader.exportAllCommandsFrom("std:main");

    loader.declareRequire("std:test");
    loader.exportAllCommandsFrom("std:test");
}

// You should export this function as "load"
exports.load = load;
