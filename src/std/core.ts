/** core.ts contains the commands that are always loaded into any file.
 *
 * These are commands needed to do things like load other modules, so they cannot not be loaded.
 *
 * However, you can still define variables with names like 'import', overriding the default.
 *
 * In this case, you WILL BE ABLE TO (can't yet) access these with 'core:import'
 */

import { CommandArguments as Args } from "../internal/command/argument";
import { Command } from "../internal/command/command";
import { DetNode, Expr, Str } from "../internal/det";
import { LapolError } from "../internal/errors";
import { ModuleLoader } from "../internal/module/loader";

export function load(loader: ModuleLoader): void {
    loader.exportCommands(commands);
}

/** The first argument is the file to load, the second is the module name. */
class RequireCommand extends Command {
    constructor() {
        super("Other", "quick_import");
    }

    call(a: Args): undefined {
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

function __doc(a: Args): DetNode {
    return new Expr("doc", a.ca(0));
}
