import { GenericHtmlTagOutputter } from "../internal/output/html";
import { ModuleLoader } from "../mod";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.declareTarget("html");

    const declareDefaultHtmlOutputter = ([tag, htmlTag]: string[]): void => {
        l.exportExprOutputter("html", tag, new GenericHtmlTagOutputter(tag, htmlTag));
    };

    [
        ["h1", "h1"],
        ["h2", "h2"],
        ["bold", "b"],
        ["italic", "i"],
    ].forEach(declareDefaultHtmlOutputter);
}
