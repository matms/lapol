import { LapolContextBuilder, LapolContext, LaPath } from "lapol/mod";

export async function main() {
    // TODO: Introduce better mechanism for getting local directory.
    const here = `${__dirname}/../..`;
    const file = new LaPath(`${here}/hello world.lap`);

    console.log(`<<< Rendering '${file.fullPath}'. >>>`);

    // TODO: Load modules
    const lc: LapolContext = await new LapolContextBuilder().build();

    await lc.render(file, "html");

    console.log(`<<< Finished rendering '${file.parsed.base}'. >>>`);
}
