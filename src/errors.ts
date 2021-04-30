export class LapolModuleError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, AstEvaluationError.prototype);
    }
}

export class CompileError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, AstEvaluationError.prototype);
    }
}

export class AstEvaluationError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, AstEvaluationError.prototype);
    }
}

export class ParserError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, ParserError.prototype);
    }
}
