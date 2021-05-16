import { ModuleManager } from "./module/manager";

export interface LapolContext {
    moduleManager: ModuleManager;
}

export function initGlobalLapoLContext(): LapolContext {
    return { moduleManager: ModuleManager._create() };
}
