export class LapolModuleError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, LapolModuleError.prototype);
    }
}

export class LapolError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, LapolError.prototype);
    }
}
