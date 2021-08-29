import { FileContext } from "../context/fileContext";
import { LapolContext } from "../context/lapolContext";
import { LapolError } from "../errors";
import { isLtrfNode, isLtrfStr, LtrfNode, LtrfObj } from "../ltrf/ltrf";
import { Output, OutputCtx, OutputDispatcher } from "./common";
import { OutputRequirementReceiver } from "./outRequirements/outRequirements";

export function composeOutput(...os: Output[]): Output {
    return { code: os.map((o) => o.code).join("") };
}

export function outputPass(
    lctx: LapolContext,
    fctx: FileContext,
    target: string,
    dispatcher: OutputDispatcher,
    reqReceiver: OutputRequirementReceiver,
    rootNode: LtrfNode
): Output {
    return outputLtrfObj(new OutputCtx(lctx, fctx, target, dispatcher, reqReceiver), rootNode);
}

export function outputLtrfObj(ctx: OutputCtx, obj: LtrfObj): Output {
    if (isLtrfStr(obj)) {
        return ctx.dispatcher.getLtrfStrOutputter(obj)(obj, ctx);
    }
    if (isLtrfNode(obj)) {
        return ctx.dispatcher.getLtrfNodeOutputter(obj)(obj, ctx);
    }
    throw new LapolError("Unreachable!");
}
