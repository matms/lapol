import * as html from "./html";

describe("htmlOutStr", () => {
    it("Escapes text into appropriate HTML", () => {
        const s = String.raw`<This is ≠ a "tag" & will be output correctly!>`;
        const o = html.htmlOutStr(s);

        expect(o.code).toEqual(
            String.raw`&#x3C;This is &#x2260; a &#x22;tag&#x22; &#x26; will be output correctly!&#x3E;`
        );
    });
});

describe("htmlOutStrWithoutEscape", () => {
    it("Escapes leaves the string unchanged", () => {
        const s = String.raw`<This is ≠ a "tag" & will be output correctly!>`;
        const o = html.htmlOutStrWithoutEscape(s);
        expect(o.code).toEqual(s);
    });
});
