import { FileContext } from "../context/fileContext";
import { LapolContext } from "../context/lapolContext";
import { LapolError } from "../errors";
import { Environment } from "../evaluate/environment";
import { FileModuleStorage } from "../module/module";
import { Namespace } from "../namespace";

export class CommandContext {
    /** Private-ish: You _probably_ shouldn't use this directly. */
    _lctx: LapolContext;
    /** Private-ish: You _probably_ shouldn't use this directly. */
    _fctx: FileContext;
    /** Private-ish: You _probably_ shouldn't use this directly. */
    _env: Environment;
    /** Private-ish: You _probably_ shouldn't use this directly. */
    _currNamespace: Namespace;

    /** @internal Do not make this yourself, if you are a Lapol user! */
    public constructor(
        lctx: LapolContext,
        fctx: FileContext,
        currEnv: Environment,
        currNamespace: Namespace
    ) {
        this._lctx = lctx;
        this._fctx = fctx;
        this._env = currEnv;
        this._currNamespace = currNamespace;
    }

    /** WARNING: In general, you should NOT access the File Module Storage for other modules,
     * only for your own! However, this capability is still provided for the rare cases where
     * you may want to do that.
     */
    public getFileModuleStorage(modName: string): FileModuleStorage {
        const out = this._fctx.moduleStorage.get(modName);
        if (out === undefined) throw new LapolError(`FileModuleStorage for ${modName} not found.`);
        return out;
    }
}
