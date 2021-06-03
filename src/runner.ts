// LaPoL Runner
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { LaPath } from "./internal/la_path";
import { jsModFromTs } from "./internal/shell/compile_ts";

const LA_PROJECT_MAIN = "main";

interface RenderCommand {
    t: "render";
    projectPath: string;
    renderAllFiles: boolean;
    filesToRender?: string[] | undefined;
}

export async function main(): Promise<void> {
    _setupNodePath();

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

                console.log(`render: ${JSON.stringify(args)}`);

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

    // TODO: Annotate appropriately, passing in useful data.
    const mainFn = jsFile[LA_PROJECT_MAIN] as () => unknown;

    // Note we are allowed to await whether or not mainFn returns a promise (normal js types
    // are awaitable!)

    // TODO: Pass in arguments.
    await mainFn();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();

/** Setup NODE_PATH to point to the folder "build" (refer to tsconfig.json).
 *
 * ## Note / Explanation:
 *
 * User defined LaPoL modules need to be able to require LaPoL files without needing to know their
 * exact location, and without needing to setup all sorts of complex nodejs stuff.
 *
 * So, we make it so that the folder that contains the compiled version of this file, and of
 * all other files is added to the NODE_PATH.
 *
 * This means require("lapol/main") will load this file, whether in core LaPoL code, or in
 * imported modules (since modules are just required dynamically, "into" the core code).
 *
 * However, this does NOT make Typescript compile this correctly. So, for typescript, refer to:
 * 1. tsconfig.json (if you want VSCode / another editor to recognize the imports, and also if,
 *    for whatever reason, you decide to use this import syntax in core LaPoL code)
 * 2. lapol/internal/shell/compile_ts, namely, `makeTsCfg`, which is responsible for setting up the
 *    TypeScript compilation settings for dynamically compiled LaPoL modules.
 */
function _setupNodePath(): void {
    // See https://stackoverflow.com/questions/21358994/node-js-programmatically-setting-node-path/33976627#33976627
    // Explanation: This serves SOLELY to allow user defined modules to load lapol files using lapol/*
    // For instance, "lapol/main" resolves to this file.

    // We cant use path.join because we should set this up before importing anything!
    // eslint-disable-next-line node/no-path-concat
    process.env.NODE_PATH = `${__dirname}/..`; // = folder build

    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    require("module").Module._initPaths();
}
