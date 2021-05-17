import { exec as nodeExec } from "child_process";
import { promisify } from "util";
import { LaPath } from "../la_path";
import { type as os_type } from "os";
import * as fs from "fs";
import { readFile, writeFile } from "../utils";
import { LapolError } from "../errors";

const fs_stat = promisify(fs.stat);
const exec = promisify(nodeExec);

function compileOutFile(modFile: LaPath): LaPath {
    let p = modFile.parsed;
    let sep = modFile.sep;
    return new LaPath(`${p.dir}${sep}.lapol${sep}build${sep}${p.name}.js`);
}

async function needCompile(modFile: LaPath) {
    let s = await fs_stat(modFile.fullPath, { bigint: true });
    let srcMTimeNs = s.mtimeNs;
    let p = modFile.parsed;
    let sep = modFile.sep;
    try {
        let c = await readFile(
            new LaPath(`${p.dir}${sep}.lapol${sep}build_meta${sep}${p.name}.build_src_time`)
        );
        if (srcMTimeNs.toString() === c.trim()) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        // If can't read metadata, it probably doesn't exist, so recompile.
        return true;
    }
}

export async function makeJsModFromTs(modFile: LaPath): Promise<LaPath> {
    let tPre = Date.now();
    if (!(await needCompile(modFile))) {
        let tPost = Date.now();
        console.log(
            `<makeJsModFromTs> Timestamp matches, NOT recompiling "${modFile.fullPath}". Took ${
                tPost - tPre
            } millis to verify this.`
        );
        return compileOutFile(modFile);
    }
    console.log(
        `\n<makeJsModFromTs> Compiling Typescript module "${modFile.fullPath}" to Javascript\n`
    );

    let s = await fs_stat(modFile.fullPath, { bigint: true });
    let srcMTimeNs = s.mtimeNs;
    let sep = modFile.sep;
    let p = modFile.parsed;

    try {
        let t0 = Date.now();
        let { stdout, stderr } = await exec(
            `tsc ".${sep}${p.base}" --outDir ".${sep}.lapol${sep}build${sep}" --target "es6" --module "commonjs"`,
            {
                cwd: p.dir,
                shell: os_type() === "Windows_NT" ? "powershell.exe" : undefined,
            }
        );

        let t1 = Date.now();
        await writeFile(
            new LaPath(`${p.dir}${sep}.lapol${sep}build_meta${sep}${p.name}.build_src_time`),
            `${srcMTimeNs.toString()}`
        );
        let t2 = Date.now();

        console.log(
            `<makeJsModFromTs> Finished compiling TS module after ${t1 - t0} (+ ${
                t2 - t1
            } extra) millis (path ${modFile.fullPath})`
        );
        console.log(`<makeJsModFromTs> Total time: ${t2 - tPre}`);
        if (stdout !== "" || stderr !== "") {
            console.log(
                `<makeJsModFromTs> "${modFile.fullPath}", exec outputted something! Notably:\n\tstdout: ${stdout}\n\tstderr:${stderr}`
            );
        }
    } catch (error) {
        throw new LapolError(`<makeJsModFromTs> "${modFile.fullPath}" - Misc. Error: ${error}`);
    }
    return compileOutFile(modFile);
}
