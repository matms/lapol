export class LapolError extends Error {
    constructor(m: string) {
        super(m);

        // Needed to extend Error.
        // See https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, LapolError.prototype);
    }
}
