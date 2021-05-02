/** core.ts contains the commands that are always loaded into any file.
 *
 * These are commands needed to do things like load other modules, so they cannot not be loaded.
 *
 * However, you can still define variables with names like 'import', overriding the default.
 *
 * In this case, you WILL BE ABLE TO (can't yet) access these with 'core:import'
 */

import { Command } from "../command/command";
import { DetNode, Str } from "../det";
import { LapolError } from "../errors";
import { Environment } from "../evaluate/environment";
import { findModulePath, LapolModule } from "../la_module/module";

/** The first argument is the file to load, the second is the module name. */
class QuickImportCommand extends Command {
    constructor() {
        super("Other", "quick_import");
    }
    call(args: DetNode[][], env: Environment): undefined {
        if (args.length !== 2) {
            throw new LapolError(`${this._name} arity mismatch.`);
        }

        if (args[0].length !== 1 || !(args[0][0] instanceof Str))
            throw new LapolError(`${this._name}: bad argument.`);
        if (args[1].length !== 1 || !(args[1][0] instanceof Str))
            throw new LapolError(`${this._name}: bad argument.`);

        let mod_file = (args[0][0] as Str).text.trim();
        let mod_name = (args[1][0] as Str).text.trim();

        // TODO: Is using sync here a big performance downgrade?
        // Can I avoid this with worker threads???
        env.loadModule(mod_name, LapolModule.loadModuleFileSync(findModulePath(mod_file)));

        return undefined;
    }
}

const quickImport = new QuickImportCommand();

export const commands = {
    quick_import: quickImport,
    // import: "TODO",
    // doc: "TODO",
};
