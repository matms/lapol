import * as ltrf from "./ltrf/ltrf";

export function debugCapture(): void {
    ltrf.LtrfNode.make("a", {}, []);
    console.log("AAA");
}
