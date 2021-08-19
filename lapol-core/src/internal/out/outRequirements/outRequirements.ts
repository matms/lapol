import { LapolError } from "../../errors";
import { LaPath } from "../../laPath";

export class OutputRequirementReceiver {
    readonly files: Map<string, LaPath>;

    private constructor() {
        this.files = new Map();
    }

    public static make(): OutputRequirementReceiver {
        return new OutputRequirementReceiver();
    }

    /** TODO: How should 'as' be interpreted? */
    public requireFile(input: LaPath, as: string): void {
        const c = this.files.get(as);
        if (c !== undefined && c.fullPath !== input.fullPath) {
            throw new LapolError(
                `OutputRequirementReceiver.requireFile: Inconsistency - required` +
                    `${input.fullPath} as ${as}, but ${as} already bound to ${c.fullPath}.`
            );
        } else {
            this.files.set(as, input);
        }
    }
}
