import * as ltrf from "./ltrf";
import { LtrfObj, LtrfNode } from "./ltrf";

describe("LtrfStr", () => {
    it("can be made", () => {
        const s = "abc";
        expect(s).toEqual("abc");
    });

    it("can be immutably changed", () => {
        const s: LtrfObj = "abc";
        const stringChanger = ltrf.ltrfObjLift((s) => s + "def", ltrf.id);
        const s2 = stringChanger(s);
        const s3 = stringChanger(s2);
        expect(s).toEqual("abc");
        expect(s2).toEqual("abcdef");
        expect(s3).toEqual("abcdefdef");
    });
});

describe("LtrfNode", () => {
    it("can be created", () => {
        const n = LtrfNode.make("sample", { a: "b" }, ["d", "e"]);
        expect(n.tag).toEqual("sample");
        expect(n.kv).toEqual({ a: "b" });
        expect(n.elems).toEqual(["d", "e"]);
    });

    it("can be immutably changed", () => {
        const n = LtrfNode.make("sample", { a: "b", x: "y" }, ["d", "e"]);
        expect(n.tag).toEqual("sample");
        expect(n.kv).toEqual({ a: "b", x: "y" });
        expect(n.elems).toEqual(["d", "e"]);

        const n2 = n.updateKv((kv) => ({ ...kv, x: "z", c: "d" })).updateElems((s) => [...s, "!"]);

        expect(n2.tag).toEqual("sample");
        expect(n2.kv).toEqual({ a: "b", x: "z", c: "d" });
        expect(n2.elems).toEqual(["d", "e", "!"]);
    });
});

describe("Ltrf Complex Operations", () => {
    it("can map over intricate structures in a functional style", () => {
        const alpha = LtrfNode.make("alpha", {}, ["beta", "gamma"]);
        const x = LtrfNode.make("a", {}, []);
        const z = LtrfNode.make("c", {}, [alpha]);
        const root = LtrfNode.make("root", {}, [x, "y", z]);

        const uppercase = ltrf.ltrfObjLift(
            (s) => s.toUpperCase(),
            (o) => o.updateElems((ns) => ns.map(uppercase))
        );

        expect(uppercase(root)).toEqual({
            _tag: "root",
            _kv: {},
            _elems: [
                { _tag: "a", _kv: {}, _elems: [] },
                "Y",
                {
                    _tag: "c",
                    _kv: {},
                    _elems: [{ _tag: "alpha", _kv: {}, _elems: ["BETA", "GAMMA"] }],
                },
            ],
        });
    });
});
