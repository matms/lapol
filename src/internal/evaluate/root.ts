import { strict as assert } from "assert";
import { AstNode, AstNodeKind, AstCommandNode, AstRootNode, AstTextNode } from "../ast";
import { Command } from "../command/command";
import { LapolContext } from "../context";
import { DetNode, Expr, Str } from "../det";
import { LapolError } from "../errors";
import { LaPath } from "../la_path";
import { procureAnonMod } from "../module/find/find";
import { resolveModule, resolveModuleFromPath } from "../module/module";
import { isWhitespace } from "../utils";
import { Environment } from "./environment";
import { evaluateNode } from "./evaluate";

function isDocNode(n: AstNode) {
    return n.t === AstNodeKind.AstCommandNode && n.commandName == "__doc";
}

function checkRoot(rootNode: AstRootNode, docIndex: number) {
    assert(rootNode.t === AstNodeKind.AstRootNode);
    if (
        rootNode.subNodes
            .map((n) => n.t === AstNodeKind.AstTextNode && !isWhitespace(n.content))
            .reduce((a, b) => a || b, false)
    ) {
        console.log(
            "WARNING: Root has direct child node with text. This is probably an error (remember to use __doc)"
        );
    }
    if (docIndex === -1) {
        console.log("WARNING: Root has no __doc child.");
    } else {
        if (
            rootNode.subNodes
                .slice(docIndex + 1)
                .map(isDocNode)
                .reduce((a, b) => a || b, false)
        ) {
            console.log("WARNING: Two __doc nodes as child of root.");
        }
        if (
            rootNode.subNodes
                .slice(docIndex + 1)
                .map((n) => n.t !== AstNodeKind.AstTextNode || !isWhitespace(n.content))
                .reduce((a, b) => a || b, false)
        ) {
            console.log("WARNING: Non whitespace nodes after __doc. This is probably an error.");
        }
    }
}

export async function evaluateRoot(
    rootNode: AstRootNode,
    lctx: LapolContext,
    filePath: string
): Promise<Expr> {
    async function getAnonModPath(): Promise<string> {
        return (await procureAnonMod(new LaPath(filePath))).fullPath;
    }

    let t0 = Date.now();

    let env = new Environment();

    let docIndex = rootNode.subNodes.findIndex(isDocNode);

    checkRoot(rootNode, docIndex);

    let header: AstCommandNode[] = rootNode.subNodes
        .slice(0, docIndex)
        .filter((n) => n.t === AstNodeKind.AstCommandNode) as AstCommandNode[];

    let modulesToLoad = [resolveModule("std:core")];

    let requiredModulesP = header
        .filter((n) => n.commandName === "__require")
        .map(async (n) => {
            if (n.curlyArgs.length === 0) {
                let identifier = resolveModuleFromPath(await getAnonModPath(), "__require_anon");
                return identifier;
            } else {
                assert(n.curlyArgs.length === 1);
                assert(n.curlyArgs[0].length === 1);
                let t = n.curlyArgs[0][0];
                assert(t.t === AstNodeKind.AstTextNode);
                let name = t.content.trim();
                let identifier = resolveModule(name);
                return identifier;
            }
        });

    let requiredModules = await Promise.all(requiredModulesP);

    modulesToLoad.push(...requiredModules);

    let modsPromise = modulesToLoad.map((id) => {
        return lctx.moduleManager.requireModule(id).then((mod) => {
            let tBeforeLoad = Date.now();
            env.loadModule(id.fullIdStr, mod);
            let tNow = Date.now();
            return id.fullIdStr;
        });
    });

    /*
    let modsPromise = modulesToLoad.map((name) => {
        assert(name.startsWith("std:"));
        let stdMod = name.substr("std:".length);
        let defaultModule = LapolModule.loadModuleFile(findStdModulePath(stdMod));
        return defaultModule.then((mod) => {
            let tBeforeLoad = Date.now();
            env.loadModule(name, mod);
            let tNow = Date.now();
            console.log(
                `Finished loading mod ${name} after ${tBeforeLoad - t0} millis (load JS Mod) +  ${
                    tNow - tBeforeLoad
                } millis (Load into env). Total ${tNow - tBeforeLoad}.`
            );
            return name;
        });
    }); */

    let t1 = Date.now();
    console.log(`<evaluateRoot> Took time ${t1 - t0} millis to set up require promises.`);

    let loadedModNames = await Promise.all(modsPromise);

    let t2 = Date.now();
    console.log(`<evaluateRoot> Took time ${t2 - t1} millis to load all required mods.`);
    console.log(
        `<evaluateRoot> Directly loaded mods (note other modules may be indirectly loaded by these): \n\t ${loadedModNames}.`
    );

    let doc = rootNode.subNodes[docIndex];

    let out = new Expr("root", [evaluateNode(doc, env)]);

    let t3 = Date.now();
    console.log(`<evaluateRoot> Took time ${t3 - t2} millis to evaluate __doc.`);
    console.log(`<evaluateRoot> Cumulative time: ${t3 - t0} millis.`);

    return out;
}
