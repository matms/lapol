// LaPoL Runner

import { strict as assert } from "assert";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { LaPath } from "./internal/la_path";
import { jsModFromTs } from "./internal/shell/compile_ts";
import { isLapolGloballyInitialized } from "./main";

const LA_PROJECT_MAIN = "main";

export interface ProjectMainArgs {
    filesToRender: "all" | string[];
}

interface RenderCommand {
    t: "render";
    projectPath: string;
    renderAllFiles: boolean;
    filesToRender?: string[] | undefined;
}

async function main(): Promise<void> {
    assert(isLapolGloballyInitialized());

    let cmd: RenderCommand | undefined;

    await yargs(hideBin(process.argv))
        .command(
            "render <project> [files]",
            "Renders a project. (-h for help).",
            (yargs) =>
                yargs
                    .positional("project", {
                        type: "string",
                        describe: "The path to a .js or .ts file which corresponds to the project",
                    })
                    .positional("files", {
                        array: true,
                        type: "string",
                        describe:
                            "The path to one or more .lap files to be rendered. Alternatively, see option --all",
                    })
                    .option("all", {
                        default: false,
                        boolean: true,
                        describe: "Render the entire project.",
                    }),
            (args) => {
                const projectPath = args.project;
                const renderAllFiles = args.all;
                const filesToRender = args["files"];
                if (projectPath === undefined) {
                    throw new Error(`You must pass a project.`);
                }
                if (renderAllFiles) {
                    if (filesToRender !== undefined && filesToRender.length !== 0) {
                        throw new Error(`If --all is used, you shouldn't pass in any file.`);
                    }
                } else {
                    if (filesToRender === undefined)
                        throw new Error(`Must indicate what file to render (or use --all)`);
                }

                cmd = {
                    t: "render",
                    projectPath: projectPath,
                    renderAllFiles: renderAllFiles,
                    filesToRender: filesToRender,
                };
            }
        )
        .help("help")
        .alias("h", "help")
        .version(false).argv;

    if (cmd === undefined) {
        console.log("No command. Exiting.");
        return;
    }

    switch (cmd.t) {
        case "render": {
            let f: "all" | string[];
            if (cmd.renderAllFiles) {
                f = "all";
            } else {
                if (cmd.filesToRender === undefined) throw new Error(`Need files to render array.`);
                f = cmd.filesToRender;
            }
            await render_command(cmd.projectPath, f);
            break;
        }
    }
}

async function render_command(projectPath: string, filesToRender: "all" | string[]): Promise<void> {
    const projectLaPath = new LaPath(projectPath);
    let jsFile: any;
    switch (projectLaPath.parsed.ext) {
        case ".js": {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            jsFile = await import(projectLaPath.fullPath);
            break;
        }
        case ".ts": {
            const jsFilePath = await jsModFromTs(projectLaPath);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            jsFile = await import(jsFilePath.fullPath);
            break;
        }
        default:
            throw new Error(`Project file should be .js or .ts`);
    }

    const mainFn = jsFile[LA_PROJECT_MAIN] as (a: ProjectMainArgs) => unknown;

    // Note we are allowed to await whether or not mainFn returns a promise (normal js types
    // are awaitable!)
    await mainFn({ filesToRender: filesToRender });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
