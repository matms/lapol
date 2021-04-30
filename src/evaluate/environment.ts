export interface Environment {
    contents: Map<string, any>;
    outerEnv: Environment | undefined;
}

export function setupDefaultEnvironment(env: Environment, defaultEnvItems: Map<string, any>) {
    let map = env.contents;

    defaultEnvItems.forEach((val, key) => {
        map.set(key, val);
    });
}

export function environmentLookup(env: Environment, key: string): any {
    if (env.contents.has(key)) {
        return env.contents.get(key);
    } else if (env.outerEnv === undefined) {
        return undefined;
    } else {
        return environmentLookup(env.outerEnv, key);
    }
}
