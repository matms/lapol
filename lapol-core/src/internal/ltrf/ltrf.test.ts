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

    it("can be updated by replacing parts", () => {
        const n = LtrfNode.make("abc", { a: "b" }, ["d"]);

        const n2 = n.withTag("def");

        expect(n2.tag).toEqual("def");
        expect(n2.elems).toBe(n.elems);
        expect(n2.kv).toBe(n.kv);

        const n3 = n2.withKv({ c: "d" });
        expect(n3.tag).toBe(n2.tag);
        expect(n3.elems).toBe(n2.elems);
        expect(n3.kv).toEqual({ c: "d" });

        const n4 = n3.withElems(["d", "e"]);
        expect(n4.elems).toEqual(["d", "e"]);
        expect(n4.tag).toBe(n3.tag);
        expect(n4.kv).toBe(n3.kv);
    });

    it("can be updated by replacing parts using a function", () => {
        const n = LtrfNode.make("abc", { a: "b" }, ["d"]);

        const n2 = n.updateTag((t) => t + "def");

        expect(n2.tag).toEqual("abcdef");
        expect(n2.elems).toBe(n.elems);
        expect(n2.kv).toBe(n.kv);

        const n3 = n2.updateKv((r) => {
            return { ...r, c: "d" };
        });
        expect(n3.tag).toBe(n2.tag);
        expect(n3.elems).toBe(n2.elems);
        expect(n3.kv).toEqual({ a: "b", c: "d" });

        const n4 = n3.updateElems((a) => [...a, "e"]);
        expect(n4.elems).toEqual(["d", "e"]);
        expect(n4.tag).toBe(n3.tag);
        expect(n4.kv).toBe(n3.kv);

        const n5 = n4.update(
            (t) => t + "ghi",
            (k) => {
                return { ...k, e: "f" };
            },
            (e) => [...e, "f"]
        );

        expect(n5.tag).toEqual("abcdefghi");
        expect(n5.kv).toEqual({ a: "b", c: "d", e: "f" });
        expect(n5.elems).toEqual(["d", "e", "f"]);
    });

    it("allows mapping over elements", () => {
        const n = LtrfNode.make("a", {}, ["x", "y", "z"]);
        const n2 = n.mapElems(ltrf.ltrfObjLift((s) => s.toUpperCase(), ltrf.id));
        expect(n2.elems).toEqual(["X", "Y", "Z"]);
    });

    it("allows flat-mapping over elements", () => {
        const n = LtrfNode.make("a", {}, ["x", "y", "z"]);
        const n2 = n.flatMapElems(ltrf.ltrfObjLiftArr((s) => [s, s], ltrf.flatMapId));
        expect(n2.elems).toEqual(["x", "x", "y", "y", "z", "z"]);
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
