import { ModuleLoader } from "lapol/mod";

// You must define a function that takes in a single parameter, the loader.
export function load(loader: ModuleLoader): void {
    // Cool!!
    // console.log("\n====== HELLO FROM simple page.js ======\n")

    // You can use the loader object to load the desired things.
    // See the ModuleLoader documentation for more details on the available methods.
    loader.declareRequire("std:main");
    loader.exportAllCommandsFrom("std:main");

    loader.declareRequire("std:test");
    loader.exportAllCommandsFrom("std:test");
}
