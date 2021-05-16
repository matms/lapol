/** core.ts contains the commands that are always loaded into any file.
 *
 * These are commands needed to do things like load other modules, so they cannot not be loaded.
 *
 * However, you can still define variables with names like 'import', overriding the default.
 *
 * In this case, you WILL BE ABLE TO (can't yet) access these with 'core:import'
 */

import { Command } from "../command/command";
import { DetNode, Expr, Str } from "../det";
import { LapolError } from "../errors";
import { Environment } from "../evaluate/environment";
import { ModuleLoader } from "../module/loader";

export function load(loader: ModuleLoader) {
    loader.exportCommands(commands);
}

/** The first argument is the file to load, the second is the module name. */
class RequireCommand extends Command {
    constructor() {
        super("Other", "quick_import");
    }
    call(args: DetNode[][], env: Environment): undefined {
        throw new LapolError(
            "__require shouldn't be evaluated, it is a special command. Probably you attempted to use __require within __doc, which is an error."
        );
    }
}

const requireCommand = new RequireCommand();

const commands = {
    __require: requireCommand,
    __doc: __doc,
    // import: "TODO",
};

function __doc(arg1: DetNode[]): DetNode {
    return new Expr("doc", arg1);
}
