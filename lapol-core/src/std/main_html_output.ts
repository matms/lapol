import { GenericHtmlTagOutputter } from "../internal/output/html";
import { ModuleLoader } from "../mod";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    const declareDefaultHtmlOutputter = (
        tag: string,
        htmlTag: string,
        attrs?: Array<{ attr: string; val: string }>
    ): void => {
        l.exportExprOutputter("html", tag, new GenericHtmlTagOutputter(tag, htmlTag, attrs));
    };

    declareDefaultHtmlOutputter("title", "h1", [{ attr: "class", val: "title" }]);
    declareDefaultHtmlOutputter("sec", "h2");
    declareDefaultHtmlOutputter("subsec", "h3");
    declareDefaultHtmlOutputter("subsubsec", "h4");

    declareDefaultHtmlOutputter("bold", "b");
    declareDefaultHtmlOutputter("italic", "i");

    declareDefaultHtmlOutputter("bquot", "blockquote");
    declareDefaultHtmlOutputter("marginnote", "aside");
}
