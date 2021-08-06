/* eslint-disable import/first */

let isNodePathInit = false;
let isLapolRsInit = false;
let isLapolFolderInfoInit = false;

// It is important to run setupNodePath _before_ importing (it messes with NODE_PATH).
if (!isNodePathInit) {
    setupNodePath();
    isNodePathInit = true;
}

import { init as lapol_rs_init } from "lapol-rs";

import { setLapolFolder } from "./internal/globalInit";
import { LaPath } from "./internal/laPath";

if (!isLapolFolderInfoInit) {
    // eslint-disable-next-line node/no-path-concat
    setLapolFolder(new LaPath(`${__dirname}/../..`)); // Folder lapol
    isLapolFolderInfoInit = true;
}

if (!isLapolRsInit) {
    lapol_rs_init(); // Sets up rust panic handler.
    isLapolRsInit = true;
}

export function isLapolGloballyInitialized(): boolean {
    return isNodePathInit && isLapolRsInit && isLapolFolderInfoInit;
}

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
 * 2. [NO LONGER POSSIBLE] lapol/internal/shell/compile_ts, namely, `makeTsCfg`, which is responsible for setting up the
 *    TypeScript compilation settings for dynamically compiled LaPoL modules.
 */
function setupNodePath(): void {
    // See https://stackoverflow.com/questions/21358994/node-js-programmatically-setting-node-path/33976627#33976627
    // Explanation: This serves SOLELY to allow user defined modules to load lapol files using lapol/*
    // For instance, "lapol/main" resolves to this file.

    // We cant use path.join because we should set this up before importing anything!
    // eslint-disable-next-line node/no-path-concat
    process.env.NODE_PATH = `${__dirname}/..`; // = folder build

    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    require("module").Module._initPaths();
}

// import { debugCapture } from "./dbg";
// debugCapture();
