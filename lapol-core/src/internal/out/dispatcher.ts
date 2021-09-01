import { LapolContext } from "../context/lapolContext";
import { LapolError } from "../errors";
import { LtrfNode } from "../ltrf/ltrf";
import { LtrfNodeOutputter, LtrfStrOutputter, OutputDispatcher } from "./common";
import { htmlOutStr } from "./outUtils/html";
import { latexOutStr } from "./outUtils/latex";

class DefaultOutputDispatcher implements OutputDispatcher {
    targetLanguage: string;
    lctx: LapolContext;
    lazyNodeOutputters: Map<string, LtrfNodeOutputter>;

    constructor(lctx: LapolContext, targetLanguage: string) {
        this.targetLanguage = targetLanguage;
        this.lctx = lctx;
        this.lazyNodeOutputters = new Map();
        // TODO: How to fill?
    }

    public getLtrfStrOutputter(_str: string): LtrfStrOutputter {
        // TODO: Allow user customization
        if (this.targetLanguage === "html") return htmlOutStr;
        // TODO: ESCAPE
        else if (this.targetLanguage === "latex") return latexOutStr;
        else
            throw new LapolError(
                `No LtrfStrOutputter configured for language ${this.targetLanguage}`
            );
    }

    public getLtrfNodeOutputter(node: LtrfNode): LtrfNodeOutputter {
        const o = this.lazyNodeOutputters.get(node.tag);
        if (o === undefined) {
            const p = this.retreiveNodeOutputterForTag(node.tag);
            this.lazyNodeOutputters.set(node.tag, p);
            return p;
        } else {
            return o;
        }
    }

    private retreiveNodeOutputterForTag(tag: string): LtrfNodeOutputter {
        const found: LtrfNodeOutputter[] = [];
        this.lctx.registry.modules.forEach((v) => {
            const o = v.getLtrfNodeOutputter(this.targetLanguage, tag);
            if (o !== undefined) found.push(o);
        });
        if (found.length === 0)
            throw new LapolError(
                `No LtrfNode outputter found for target ${this.targetLanguage} and tag ${tag}.`
            );
        if (found.length >= 2)
            throw new LapolError(
                `Too many LtrfNode outputters found for target ${this.targetLanguage} and tag ${tag}. Not sure which to use!`
            );
        return found[0];
    }
}

export function makeOutputDispatcher(lctx: LapolContext, targetLanguage: string): OutputDispatcher {
    return new DefaultOutputDispatcher(lctx, targetLanguage);
}
