export interface StdModuleIdentifier {
    isStd: true;
    modName: string;
    fullIdStr: string;
}

export interface UserModuleIdentifier {
    isStd: false;
    pathStr: string;
    modName: string;
    fullIdStr: string;
}

export type ModuleIdentifier = StdModuleIdentifier | UserModuleIdentifier;

export interface ModuleMetadata {
    identifier: ModuleIdentifier;
    requiredModules: ModuleIdentifier[];
}
