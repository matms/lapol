import { LapolError } from "../errors";
import { LapolModule, resolveModule } from "./module";
import { ModuleIdentifier } from "./metadata";
import { strict as assert } from "assert";
import { Command, JsFnCommand } from "../command/command";

export class ModuleLoader {
    private _commands: Map<string, Command>;
    private _identifier: ModuleIdentifier;
    private _requiredModules: ModuleIdentifier[];

    private _requiredModulesLoaded: undefined | Map<string, LapolModule>;
    private _finalizeActions: (() => void)[];

    private constructor(identifier: ModuleIdentifier) {
        this._identifier = identifier;
        this._requiredModules = [];
        this._finalizeActions = [];
        this._commands = new Map();
    }

    get requiredModules() {
        return this._requiredModules;
    }

    /** Internal use --- Module developer MUST NOT CALL!
     *
     * Called to make a new ModuleLoader
     */
    public static _make(identifier: ModuleIdentifier): ModuleLoader {
        return new ModuleLoader(identifier);
    }

    /** Internal use --- Module developer MUST NOT CALL!
     *
     * Called after _make but before _afterRequiredLoad, specifically right after this module's
     * load() function has been run.
     */
    public _afterSelfLoad() {}

    /** Internal use --- Module developer MUST NOT CALL!
     *
     * Called after _afterSelfLoad but before _finalize, after all the required modules have been
     * loaded.
     */
    public _afterRequiredLoad(mods: Map<string, LapolModule>) {
        this._requiredModulesLoaded = mods;
    }

    /** Internal use --- Module developer MUST NOT CALL!
     *
     * This is called last, after the requiredModules have been loaded. Anything that
     * requires the modules to be loaded should be done here.
     */
    public _finalize(): LapolModule {
        for (let f of this._finalizeActions) {
            f();
        }

        ModuleLoader.log(`_finalize: Finished loading ${this._identifier.fullIdStr}`);

        return new LapolModule(this._commands, {
            identifier: this._identifier,
            requiredModules: this._requiredModules,
        });
    }

    /** Export one or more commands.
     *
     * `commands` should be an object "mapping" a command name to a command definition.
     *
     * There are three ways to define a command. You can use a javascript function, an array
     * comprised of a javascript function followed by an object with configurations, or using a
     * Command object directly. The first two are recommended for LAPOL Module development,
     * the last one is mostly for internal use (module developers should refrain from using it).
     *
     * Note this doesn't load the command immediately, it simply enqueues the command for loading.
     */
    public exportCommands(commands: any) {
        this._finalizeActions.push(() => {
            assert(typeof commands === "object");

            for (let prop of Object.getOwnPropertyNames(commands)) {
                let val = commands[prop];
                if (typeof val === "function") {
                    this._commands.set(prop, JsFnCommand.fromJsFunction(val, prop));
                } else if (Array.isArray(val)) {
                    assert(val.length === 2);
                    this._commands.set(prop, JsFnCommand.fromJsFunction(val[0], prop, val[1]));
                } else if (val instanceof Command) {
                    this._commands.set(prop, val);
                }
            }
        });
    }

    /** Export all commands from a different module. Note that module must be required, see
     * declareRequire().
     */
    public exportAllCommandsFrom(otherModule: string) {
        this._finalizeActions.push(() => {
            assert(this._requiredModulesLoaded !== undefined);
            let mod = this._requiredModulesLoaded.get(resolveModule(otherModule).fullIdStr);
            assert(mod !== undefined);
            for (let [k, cmd] of mod.borrowCommands()) {
                this._commands.set(k, cmd);
            }
        });
    }

    /** Declare that a module is required for this module to function. Note that this does
     * not load the module into the environment automatically. Note that this does not load
     * the module immediately (i.e. we do not await for the module to load)
     */
    public declareRequire(moduleName: string) {
        this._requiredModules.push(resolveModule(moduleName));
    }

    private static log(str: string) {
        console.log("[ModuleLoader] " + str);
    }
}
