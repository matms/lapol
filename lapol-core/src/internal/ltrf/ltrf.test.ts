import * as ltrf from "./ltrf";
import { LtrfObj, LtrfNode } from "./ltrf";

describe("LtrfStr", () => {
    it("can be made", () => {
        const s = "abc";
        expect(s).toEqual("abc");
    });

    it("can be immutably changed", () => {
        const s: LtrfObj = "abc";
        const stringChanger = ltrf.lift((s) => s + "def", ltrf.id);
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
        expect(n.sub).toEqual(["d", "e"]);
    });

    it("can be immutably changed", () => {
        const n = LtrfNode.make("sample", { a: "b", x: "y" }, ["d", "e"]);
        expect(n.tag).toEqual("sample");
        expect(n.kv).toEqual({ a: "b", x: "y" });
        expect(n.sub).toEqual(["d", "e"]);

        const n2 = n.mapKv((kv) => ({ ...kv, x: "z", c: "d" })).mapSub((s) => [...s, "!"]);

        expect(n2.tag).toEqual("sample");
        expect(n2.kv).toEqual({ a: "b", x: "z", c: "d" });
        expect(n2.sub).toEqual(["d", "e", "!"]);
    });
});

describe("Ltrf Complex Operations", () => {
    it("can map over intricate structures in a functional style", () => {
        const alpha = LtrfNode.make("alpha", {}, ["beta", "gamma"]);
        const x = LtrfNode.make("a", {}, []);
        const z = LtrfNode.make("c", {}, [alpha]);
        const root = LtrfNode.make("root", {}, [x, "y", z]);

        const uppercase = ltrf.lift(
            (s) => s.toUpperCase(),
            (o) => o.mapSub((ns) => ns.map(uppercase))
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
