import { InternalFileContext, InternalLapolContext } from "../context";
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

    public getFileModuleStorage(modName: string): FileModuleStorage {
        const out = this._fctx.moduleStorage.get(modName);
        if (out === undefined) throw new LapolError(`FileModuleStorage for ${modName} not found.`);
        return out;
    }
}
