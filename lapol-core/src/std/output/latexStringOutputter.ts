import { Output, StringOutputterProvider } from "../../mod";

export class LatexStringOutputter implements StringOutputterProvider {
    default(s: string): Output {
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

    withoutEscape(s: string): Output {
        return { code: s };
    }
}
