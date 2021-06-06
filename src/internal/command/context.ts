import { InternalLapolContext } from "../context";
import { Environment } from "../evaluate/environment";
import { Namespace } from "../namespace";

export interface CommandContext {
    lctx: InternalLapolContext;
    currEnv: Environment;
    currNamespace: Namespace;
}
