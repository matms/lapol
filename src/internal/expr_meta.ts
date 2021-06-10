import { LapolError } from "./errors";

const DEFAULTS: Map<string, boolean> = new Map();
DEFAULTS.set("isBlock", false);

/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
export interface ExprMetaDeclaration {
    /** Whether this Expr is a block style expr (as understood in HTML).
     *
     * Block style Expr cause paragraphing to be handled differently.
     *
     * false by default. */
    isBlock?: boolean;
}

export interface ExprMeta {
    isBlock: boolean;
}

export function makeExprMeta(declarations: ExprMetaDeclaration[]): ExprMeta {
    return {
        isBlock: mergeDeclAttribute(declarations, "isBlock"),
    };
}

function mergeDeclAttribute(declarations: ExprMetaDeclaration[], v: string): boolean {
    const _default = DEFAULTS.get(v);
    if (_default === undefined) throw new LapolError(`Missing EXPR META default for ${v}`);
    // Yes this isn't the safest... I know.
    const f = (d: ExprMetaDeclaration): boolean | undefined => (d as any)[v] as boolean | undefined;

    if (declarations.some((d) => f(d) === true) && declarations.some((d) => f(d) === false))
        throw new LapolError(`Inconsistent ExprMetaDeclarations for attribute ${v}.`);
    else if (declarations.some((d) => f(d) === true)) return true;
    else if (declarations.some((d) => f(d) === false)) return false;
    else return _default;
}
