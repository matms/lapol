/** Outputting, AKA the "Back Pass" */

import { DetNode } from "../det";
import { LapolError } from "../errors";
import { outputNodeToHtml } from "./html";

export interface OutputData {
    str: string;
}

export async function outputDet(detRootNode: DetNode, target: string): Promise<OutputData> {
    switch (target) {
        case "html":
            return outputToHtml(detRootNode);

        default:
            throw new LapolError(`Unknown compilation target language ${target}.`);
    }
}

function outputToHtml(detRootNode: DetNode): OutputData {
    return { str: outputNodeToHtml(detRootNode) };
}
