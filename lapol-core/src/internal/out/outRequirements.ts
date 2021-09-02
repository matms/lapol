import { LapolError } from "../errors";
import { LaPath } from "../laPath";

import * as path from "path";

export class OutputRequirementReceiver {
    readonly files: Map<string, LaPath>;

    private constructor() {
        this.files = new Map();
    }

    public static make(): OutputRequirementReceiver {
        return new OutputRequirementReceiver();
    }

    public requireFile(input: LaPath, as: string): void {
        const targetPath = path.normalize(as);
        const c = this.files.get(targetPath);
        if (c !== undefined && c.fullPath !== input.fullPath) {
            throw new LapolError(
                `OutputRequirementReceiver.requireFile: Inconsistency - required` +
                    `${input.fullPath} as ${targetPath}, but ${targetPath} already bound to ${c.fullPath}.`
            );
        } else {
            this.files.set(targetPath, input);
        }
    }
}
