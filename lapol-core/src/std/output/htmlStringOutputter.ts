import { Output, StringOutputterProvider } from "../../mod";

import { encode as heEncode } from "he";

export class HtmlStringOutputter implements StringOutputterProvider {
    default(s: string): Output {
        return { code: heEncode(s, { strict: true }) };
    }

    withoutEscape(s: string): Output {
        return { code: s };
    }
}
