// Setup the NODE_PATH variable before importing stuff.
_setupNodePath();

import { render } from "./internal/run";
import { init as lapol_rs_init } from "lapol-rs";

export async function consoleMain(): Promise<void> {
    console.log("Hello, LaPoL!");
    console.log(process.argv);

    const args = process.argv.slice(2);
    console.log(args);

    if (args.length === 0) {
        console.log("No arguments passed, so not doing anything, I think (?)");
    } else {
        if (args[0] === "render") {
            if (args.length !== 2) {
                console.error(`LAPOL ERROR <@ main>: Must indicate exactly one file to render`);
            } else await render(args[1]);
        } else if (args[0] === "profile") {
            if (args.length !== 2) {
                console.error(`LAPOL ERROR <@ main>: Must indicate exactly one file to render`);
            } else {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    await render(args[1]);
                }
            }
        } else console.error(`LAPOL ERROR <@ main>: Unknown command ${args[0]}`);
    }
}

lapol_rs_init();

consoleMain();

/*
async function stress() {
    //while (true) {
    // await test_rust();
    await consoleMain();
    //}
}
*/

// ================================================================================================

/** Setup NODE_PATH to point to the folder "build" (refer to tsconfig.json).
 *
 * ## Note / Explanation:
 *
 * User defined LaPoL modules need to be able to require LaPoL files without needing to know their
 * exact location, and without needing to setup all sorts of complex nodejs stuff.
 *
 * So, we make it so that the folder that contains the compiled version of this file, and of
 * all other files is added to the NODE_PATH.
 *
 * This means require("lapol/main") will load this file, whether in core LaPoL code, or in
 * imported modules (since modules are just required dynamically, "into" the core code).
 *
 * However, this does NOT make Typescript compile this correctly. So, for typescript, refer to:
 * 1. tsconfig.json (if you want VSCode / another editor to recognize the imports, and also if,
 *    for whatever reason, you decide to use this import syntax in core LaPoL code)
 * 2. lapol/internal/shell/compile_ts, namely, `makeTsCfg`, which is responsible for setting up the
 *    TypeScript compilation settings for dynamically compiled LaPoL modules.
 */
function _setupNodePath() {
    // See https://stackoverflow.com/questions/21358994/node-js-programmatically-setting-node-path/33976627#33976627
    // Explanation: This serves SOLELY to allow user defined modules to load lapol files using lapol/*
    // For instance, "lapol/main" resolves to this file.
    process.env.NODE_PATH = `${__dirname}/..`; // = folder build
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("module").Module._initPaths();
}
