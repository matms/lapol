import { functionToCommand } from "../command/function_to_command";
import { LapolModuleError } from "../errors";

/** Load module, return map with its contents. Internal use function (in the future,
 * a better function will be provided that also returns module metadata). */
export async function loadLapolModAsMap(modPath: string): Promise<Map<string, any>> {
    let mod = await import(modPath);
    let map = new Map();

    if (!mod.hasOwnProperty("define")) {
        throw new LapolModuleError("No define propriety in module");
    }

    for (let prop of Object.getOwnPropertyNames(mod.define)) {
        let val = mod.define[prop];
        if (typeof val === "function") {
            map.set(prop, functionToCommand(val, prop));
        } else {
            map.set(prop, mod.val);
        }
    }

    return map;
}
