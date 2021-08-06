import { Command } from "../command/command";
import { InternalLapolContext } from "../context";
import { LapolError } from "../errors";
import { parseIdentifier } from "../identifier";
import { Environment } from "./environment";

const STD_CORE_MOD = "std::core";
const DEFAULT_USE_FROM_CORE = ["__doc", "__require", "__using", "__using_all"];

/** Given a properly-initialized lctx, sets up an environment with "std::core".
 * Also automatically "uses" the core commands. */
export function makeEnvironmentWithStdCoreSetup(lctx: InternalLapolContext): Environment {
    const env = new Environment();

    function addUsingFromCoreHelper(cmd: string): void {
        env.rootNamespace.addUsing(
            `${cmd}`,
            env.rootNamespace.lookupItem(parseIdentifier(`${STD_CORE_MOD}:${cmd}`)) as Command
        );
    }

    const mod = lctx.registry.modules.get(STD_CORE_MOD);
    if (mod === undefined)
        throw new LapolError(
            `Module ${STD_CORE_MOD} was required: you need to provide it when building LapolContext.`
        );
    env.loadModule(STD_CORE_MOD, mod);

    DEFAULT_USE_FROM_CORE.forEach(addUsingFromCoreHelper);

    return env;
}
