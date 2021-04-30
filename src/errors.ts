export class LapolModuleError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, LapolModuleError.prototype);
    }
}

// TODO: Make all errors of kind LapolError?
export class LapolError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, LapolError.prototype);
    }
}
