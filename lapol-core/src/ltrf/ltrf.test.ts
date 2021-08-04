import * as ltrf from "./ltrf";
import { LtrfObj } from "./ltrf";

describe("LtrfStr", () => {
    it("can be made", () => {
        const s = ltrf.makeLtrfStr("abc");
        expect(s).toEqual("abc");
    });

    it("can be immutably changed", () => {
        const s: LtrfObj = ltrf.makeLtrfStr("abc");
        const stringChanger = ltrf.lift((s) => s + "def", ltrf.id);
        const s2 = stringChanger(s);
        const s3 = stringChanger(s2);
        expect(ltrf.strOrErr(s)).toEqual("abc");
        expect(ltrf.strOrErr(s2)).toEqual("abcdef");
        expect(ltrf.strOrErr(s3)).toEqual("abcdefdef");
    });
});

describe("LtrfNode", () => {
    it("can be created", () => {
        const n = ltrf.makeLtrfNode("sample", { a: "b" }, ["d", "e"]);
        expect(ltrf.tag(n)).toEqual("sample");
        expect(ltrf.kv(n)).toEqual({ a: "b" });
        expect(ltrf.sub(n)).toEqual(["d", "e"]);
    });

    it("can be immutably changed", () => {
        const n = ltrf.makeLtrfNode("sample", { a: "b", x: "y" }, ["d", "e"]);
        expect(ltrf.tag(n)).toEqual("sample");
        expect(ltrf.kv(n)).toEqual({ a: "b", x: "y" });
        expect(ltrf.sub(n)).toEqual(["d", "e"]);

        const n2 = ltrf.mapSub(
            ltrf.mapKv(n, (kv) => ({ ...kv, x: "z", c: "d" })),
            (s) => [...s, "!"]
        );

        expect(ltrf.tag(n2)).toEqual("sample");
        expect(ltrf.kv(n2)).toEqual({ a: "b", x: "z", c: "d" });
        expect(ltrf.sub(n2)).toEqual(["d", "e", "!"]);
    });
});

describe("Ltrf Complex Operations", () => {
    it("can map over intricate structures in a functional style", () => {
        const alpha = ltrf.makeLtrfNode("alpha", {}, ["beta", "gamma"]);
        const x = ltrf.makeLtrfNode("a", {}, []);
        const z = ltrf.makeLtrfNode("c", {}, [alpha]);
        const root = ltrf.makeLtrfNode("root", {}, [x, "y", z]);

        const uppercase = ltrf.lift(
            (s) => s.toUpperCase(),
            (o) => ltrf.mapSub(o, (ns) => ns.map(uppercase))
        );

        expect(uppercase(root)).toEqual({
            _tag: "root",
            _kv: {},
            _sub: [
                { _tag: "a", _kv: {}, _sub: [] },
                "Y",
                {
                    _tag: "c",
                    _kv: {},
                    _sub: [{ _tag: "alpha", _kv: {}, _sub: ["BETA", "GAMMA"] }],
                },
            ],
        });
    });
});
