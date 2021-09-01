import { LatexStringOutputter } from "./latexStringOutputter";

describe("latexOutStr", () => {
    it("Leaves most text unchanged", () => {
        const s = "Hello, world!\nHello, LaTeX!";
        const o = new LatexStringOutputter().default(s);
        expect(o.code).toEqual(s);
    });
    it("Escapes characters with special meaning in LaTeX", () => {
        const s = "& % $ # _ { } ~ ^ \\";
        const o = new LatexStringOutputter().default(s);
        expect(o.code).toEqual(
            String.raw`\& \% \$ \# \_ \{ \} \textasciitilde{} \textasciicircum{} \textbackslash{}`
        );
    });
});

describe("latexOutStrWithoutEscape", () => {
    it("Leaves most text unchanged", () => {
        const s = "Hello, world!\nHello, LaTeX!";
        const o = new LatexStringOutputter().withoutEscape(s);
        expect(o.code).toEqual(s);
    });
    it("Also leaves escape characters unchanged", () => {
        const s = "& % $ # _ { } ~ ^ \\";
        const o = new LatexStringOutputter().withoutEscape(s);
        expect(o.code).toEqual(s);
    });
});
