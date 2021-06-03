import { ModuleManager } from "./module/manager";

export interface InternalLapolContext {
    moduleManager: ModuleManager;
}

export function initInternalLapoLContext(): InternalLapolContext {
    return { moduleManager: ModuleManager._create() };
}
