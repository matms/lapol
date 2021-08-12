/** core.ts contains the commands that are always loaded into any file.
 *
 * These are commands needed to do things like load other modules, so they cannot not be loaded.
 *
 * However, you can still define variables with names like 'import', overriding the default.
 *
 * In this case, you WILL BE ABLE TO (can't yet) access these with 'core:import'
 */

import { isLtrfStr, LtrfNode, LtrfObj } from "../internal/ltrf/ltrf";
import { CommandArguments as Args } from "../internal/command/argument";
import { Command } from "../internal/command/command";
import { CommandContext } from "../internal/command/commandContext";
import { LapolError } from "../internal/errors";
import { parseIdentifier } from "../internal/identifier";
import { ModuleLoader } from "../internal/module/loader";
import { Namespace } from "../internal/namespace";
import { makeHtmlRootOutputter, makeHtmlTagOutputter } from "./output/htmlTagOutputter";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.requireName("std::core");

    l.declareInstantiator(() => {
        return {
            moduleName: "std::core",
        };
    });

    // TODO: change deprecated fn.
    l.exportCommands(commands);

    l.declareTarget("html");

    l.exportLtrfNodeOutputter("html", "__root", makeHtmlRootOutputter());
    l.exportLtrfNodeOutputter("html", "__doc", makeHtmlTagOutputter("div"));
    l.exportLtrfNodeOutputter("html", "__p", makeHtmlTagOutputter("p"));
}

/** The first argument is the file to load, the second is the module name. */
class RequireCommand extends Command {
    constructor() {
        super("Other", "quick_import");
    }

    call(a: Args, ctx: CommandContext): readonly LtrfObj[] {
        const lctx = ctx._lctx;
        const env = ctx._env;

        const modNode = a.caOrErr(0)[0];
        if (!isLtrfStr(modNode))
            throw new LapolError("__require: Must pass in a single module name string");

        const modName = modNode.trim();

        const mod = lctx.registry.modules.get(modName);
        if (mod === undefined)
            throw new LapolError(
                `__require: Module ${modName} was required: you need to provide it when building LapolCompiler.`
            );

        env.loadModule(mod);

        return [];
    }
}

class UsingCommand extends Command {
    constructor() {
        super("Other", "__using");
    }

    call(a: Args, ctx: CommandContext): readonly LtrfObj[] {
        const thing = a.sa(0);
        if (thing === undefined)
            throw new LapolError(`__using: Must provide thing to use (as 0th square argument)`);
        if (typeof thing !== "string")
            throw new LapolError(
                `__using: thing to use (0th square argument) must be identifier string.`
            );

        let from = a.kwa("from");
        if (from !== undefined && typeof from !== "string")
            throw new LapolError(`__using: from must be identifier string.`);

        if (from === undefined) {
            from = "";
        } else {
            from += ":";
        }

        const as = a.kwa("as");
        if (as === undefined) throw new LapolError(`__using: Must provide as`);
        if (typeof as !== "string") throw new LapolError(`__using: as must be identifier string.`);

        const target = ctx._currNamespace.lookup(parseIdentifier(from + thing));

        if (target === undefined) throw new LapolError(`__using: Could not find "from"`);

        ctx._currNamespace.addUsing(as, target);

        return [];
    }
}

class UsingAllCommand extends Command {
    constructor() {
        super("Other", "__using_all");
    }

    call(a: Args, ctx: CommandContext): readonly LtrfObj[] {
        const from = a.kwa("from");
        if (from === undefined)
            throw new LapolError(`__using_all: Must provide thing to use (as 0th square argument)`);
        if (typeof from !== "string")
            throw new LapolError(`__using_all: from must be identifier string.`);

        const prefixIn = a.kwa("prefix_in", "");
        if (typeof prefixIn !== "string")
            throw new LapolError(`__using_all: prefix_in must be string.`);

        const target = ctx._currNamespace.lookup(parseIdentifier(from));
        if (!(target instanceof Namespace))
            throw new LapolError(`using_all: from must be namespace.`);

        for (const [k, v] of target.children) {
            ctx._currNamespace.addUsing(prefixIn + k, v);
        }

        return [];
    }
}

const requireCommand = new RequireCommand();
const usingCommand = new UsingCommand();
const usingAllCommand = new UsingAllCommand();

const commands = {
    __require: requireCommand,
    __using: usingCommand,
    __using_all: usingAllCommand,
    __doc: docCommand,
};

function docCommand(a: Args): readonly LtrfObj[] {
    return [LtrfNode.make("__doc", {}, a.caOrErr(0))];
}
