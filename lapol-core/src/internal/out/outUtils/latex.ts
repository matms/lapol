import { LtrfStr } from "../../ltrf/ltrf";
import { Output } from "../common";

/** Output an escaped string to LaTeX. */
export function latexOutStr(s: LtrfStr): Output {
    let out = "";
    for (const c of s) {
        switch (c) {
            case "&":
            case "%":
            case "$":
            case "#":
            case "_":
            case "{":
            case "}":
                out += "\\";
                out += c;
                break;
            case "~":
                out += "\\textasciitilde{}";
                break;
            case "^":
                out += "\\textasciicircum{}";
                break;
            case "\\":
                out += "\\textbackslash{}";
                break;
            default:
                out += c;
                break;
        }
    }
    return { code: out };
}

export function latexOutStrWithoutEscape(s: LtrfStr): Output {
    return { code: s };
}
