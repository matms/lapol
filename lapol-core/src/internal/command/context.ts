import { InternalFileContext, InternalLapolContext } from "../context/context";
import { LapolError } from "../errors";
import { Environment } from "../evaluate/environment";
import { FileModuleStorage } from "../module/module";
import { Namespace } from "../namespace";

export class CommandContext {
    /** Private-ish: You _probably_ shouldn't use this directly. */
    _lctx: InternalLapolContext;
    /** Private-ish: You _probably_ shouldn't use this directly. */
    _fctx: InternalFileContext;
    /** Private-ish: You _probably_ shouldn't use this directly. */
    _currEnv: Environment;
    /** Private-ish: You _probably_ shouldn't use this directly. */
    _currNamespace: Namespace;

    /** @internal Do not make this yourself, if you are a Lapol user! */
    public constructor(
        lctx: InternalLapolContext,
        fctx: InternalFileContext,
        currEnv: Environment,
        currNamespace: Namespace
    ) {
        this._lctx = lctx;
        this._fctx = fctx;
        this._currEnv = currEnv;
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
