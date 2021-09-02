import { LapolContext } from "../context/lapolContext";
import { LapolError } from "../errors";
import { LtrfNode } from "../ltrf/ltrf";
import {
    LtrfNodeOutputter,
    LtrfStrOutputter,
    OutputDispatcher,
    StringOutputterProvider,
} from "./common";

export class DefaultOutputDispatcher implements OutputDispatcher {
    targetLanguage: string;
    lctx: LapolContext;
    lazyNodeOutputters: Map<string, LtrfNodeOutputter>;
    stringOutputterProvider: StringOutputterProvider;

    private constructor(lctx: LapolContext, targetLanguage: string) {
        this.targetLanguage = targetLanguage;
        this.lctx = lctx;
        this.lazyNodeOutputters = new Map();
        this.stringOutputterProvider = this.retreiveStringOutputterProvider();
        // TODO: How to fill?
    }

    public static make(lctx: LapolContext, targetLanguage: string): DefaultOutputDispatcher {
        return new DefaultOutputDispatcher(lctx, targetLanguage);
    }

    public getDefaultLtrfStrOutputter(_str: string): LtrfStrOutputter {
        return this.stringOutputterProvider.default;
    }

    public getWithoutEscapeLtrfStrOutputter(_str: string): LtrfStrOutputter {
        return this.stringOutputterProvider.withoutEscape;
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

    private retreiveStringOutputterProvider(): StringOutputterProvider {
        const found: StringOutputterProvider[] = [];
        this.lctx.registry.modules.forEach((v) => {
            const o = v.getStringOutputterProvider(this.targetLanguage);
            if (o !== undefined) found.push(o);
        });

        if (found.length === 0)
            throw new LapolError(
                `No StringOutputterProvider found for target ${this.targetLanguage}.`
            );
        if (found.length >= 2)
            throw new LapolError(
                `Too many StringOutputterProvider found for target ${this.targetLanguage}. Not sure which to use!`
            );
        return found[0];
    }
}
