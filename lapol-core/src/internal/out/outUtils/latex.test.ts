import * as latex from "./latex";

describe("latexOutStr", () => {
    it("Leaves most text unchanged", () => {
        const s = "Hello, world!\nHello, LaTeX!";
        const o = latex.latexOutStr(s);
        expect(o.code).toEqual(s);
    });
    it("Escapes characters with special meaning in LaTeX", () => {
        const s = "& % $ # _ { } ~ ^ \\";
        const o = latex.latexOutStr(s);
        expect(o.code).toEqual(
            String.raw`\& \% \$ \# \_ \{ \} \textasciitilde{} \textasciicircum{} \textbackslash{}`
        );
    });
});

describe("latexOutStrWithoutEscape", () => {
    it("Leaves most text unchanged", () => {
        const s = "Hello, world!\nHello, LaTeX!";
        const o = latex.latexOutStrWithoutEscape(s);
        expect(o.code).toEqual(s);
    });
    it("Also leaves escape characters unchanged", () => {
        const s = "& % $ # _ { } ~ ^ \\";
        const o = latex.latexOutStrWithoutEscape(s);
        expect(o.code).toEqual(s);
    });
});
