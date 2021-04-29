import { fnToCommand } from "./command";
import { LapolModuleError } from "./errors";

export async function loadLapolMod(modPath: string): Promise<Map<string, any>> {
    let mod = await import(modPath);
    let map = new Map();

    if (!mod.hasOwnProperty("define")) {
        throw new LapolModuleError("No define propriety in module");
    }

    for (let prop of Object.getOwnPropertyNames(mod.define)) {
        let val = mod.define[prop];
        if (typeof val === "function") {
            map.set(prop, fnToCommand(val));
        } else {
            map.set(prop, mod.val);
        }
    }

    return map;
}
