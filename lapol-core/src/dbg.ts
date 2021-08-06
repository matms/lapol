import * as ltrf from "./internal/ltrf/ltrf";

export function debugCapture(): void {
    ltrf.LtrfNode.make("a", {}, []);
    console.log("AAA");
}
