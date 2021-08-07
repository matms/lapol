import { FileContext } from "../context/fileContext";
import { LapolContext } from "../context/lapolContext";
import { LtrfNode } from "../ltrf/ltrf";

export interface ProcessingCtx {
    lctx: LapolContext;
    fctx: FileContext;
}

export type RootProcessingFunction = (c: ProcessingCtx, n: LtrfNode) => LtrfNode;
