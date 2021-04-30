/** Outputting, AKA the "Back Pass" */

import { DetNode } from "../det";
import { LapolError } from "../errors";
import { outputNodeToHtml } from "./html";

interface CompilationOutput {
    str: string;
}

export async function outputDet(detRootNode: DetNode, target: string): Promise<CompilationOutput> {
    switch (target) {
        case "html":
            return outputToHtml(detRootNode);

        default:
            throw new LapolError(`Unknown compilation target language ${target}.`);
    }
}

function outputToHtml(detRootNode: DetNode): CompilationOutput {
    return { str: outputNodeToHtml(detRootNode) };
}
