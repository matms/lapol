import { AstTextNode } from "../ast";
import { InternalFileContext, InternalLapolContext } from "../context";
import { LapolRegistry } from "../registry/registry";
import { Environment } from "./environment";
import * as evaluate from "./evaluate";

const MOCK_META = { startCol: -1, startLine: -1, startOffset: -1 };

describe("_evaluateNode", () => {
    it("Evaluates text nodes", () => {
        const lctx = new InternalLapolContext(new LapolRegistry());
        const fctx = new InternalFileContext(new Map());
        const env = new Environment();

        const node: AstTextNode = {
            t: "AstTextNode",
            meta: MOCK_META,
            content: "abcde",
        };

        const out = evaluate._evaluateNode(lctx, fctx, env, node);

        expect(out.length).toEqual(1);
        expect(out[0]).toEqual("abcde");
    });
});

// TODO: Test commands... How?
