// Utilities for the Module implementer.

import { strict as assert } from "assert";
import { Command, JsFnCommand } from "../command/command";

/** ModuleLoader provides utilities for a Module Developer.
 *
 * IMPORTANT: DO NOT INITIALIZE YOUR OWN MODULE LOADER IF YOU ARE AN USER! */
export class ModuleLoader {
    private _map: Map<string, Command>;

    /** DO NOT INITIALIZE YOUR OWN MODULE LOADER IF YOU ARE AN USER! */
    public constructor(map: Map<string, Command>) {
        this._map = map;
    }

    /** Export one or more commands.
     *
     * `commands` should be an object "mapping" a command name to a command.
     *
     * There are three ways to make a command. You can use a javascript function, an array
     * comprised of a javascript function followed by an object with configurations, or a Command
     * object. The first two are recommended for LAPOL Module development, the last one is mainly
     * for internal use (module developers should refrain from using it).
     */
    public exportCommands(commands: any) {
        assert(typeof commands === "object");

        for (let prop of Object.getOwnPropertyNames(commands)) {
            let val = commands[prop];
            if (typeof val === "function") {
                this._map.set(prop, JsFnCommand.fromJsFunction(val, prop));
            } else if (Array.isArray(val)) {
                assert(val.length === 2);
                this._map.set(prop, JsFnCommand.fromJsFunction(val[0], prop, val[1]));
            } else if (val instanceof Command) {
                this._map.set(prop, val);
            }
        }
    }
}

// TODO: Provide utilities to add new processing steps; To add output stuff, etc.
