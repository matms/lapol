// A tsconfig.json file will be autogenerated to point "lapol/mod" to the correct directory.
import { Expr, ModuleLoader } from "lapol/mod";

export function load(loader: ModuleLoader): void {
    loader.exportCommands(commands);
}

const commands = {
    h1: (f) => new Expr("h1", f.ca(0)),
    h2: (f) => new Expr("h2", f.ca(0)),
    h3: (f) => new Expr("h3", f.ca(0)),
    h4: (f) => new Expr("h4", f.ca(0)),
    h5: (f) => new Expr("h5", f.ca(0)),
    h6: (f) => new Expr("h6", f.ca(0)),
    textit: (f) => new Expr("i", f.ca(0)),
};
