import { functionToCommand } from "../command/function_to_command";
import { LapolModuleError } from "../errors";

const LA_MOD_EXPORT_COMMAND_NAME = "commands";

/** Load module, return map with its contents. Internal use function (in the future,
 * a better function will be provided that also returns module metadata). */
export async function loadLapolModAsMap(modPath: string): Promise<Map<string, any>> {
    let mod = await import(modPath);
    let map = new Map();

    if (!mod.hasOwnProperty(LA_MOD_EXPORT_COMMAND_NAME)) {
        throw new LapolModuleError(`No ${LA_MOD_EXPORT_COMMAND_NAME} propriety in module`);
    }

    for (let prop of Object.getOwnPropertyNames(mod[LA_MOD_EXPORT_COMMAND_NAME])) {
        let val = mod[LA_MOD_EXPORT_COMMAND_NAME][prop];
        if (typeof val === "function") {
            map.set(prop, functionToCommand(val, prop));
        } else {
            map.set(prop, mod.val);
        }
    }

    return map;
}
