import { strict as assert } from "assert";
import { type } from "node:os";
import { isWhitespace } from "./la_utils";

// End of file
const EOF_MARKER = Symbol("EOF");
// Likely ◊;
const LINE_COMMENT_START_MARKER = Symbol("LINE_COMMENT_START");
// Likely ◊; followed by opening brace. Note opening brace is NOT matched here.
const BLOCK_COMMENT_START_MARKER = Symbol("BLOCK_COMMENT_START");
// Likely {
const OPEN_CURLY_MARKER = Symbol("OPEN_CURLY_MARKER");
// Likely }
const CLOSE_CURLY_MARKER = Symbol("CLOSE_CURLY_MARKER");
// Likely [
const OPEN_SQUARE_MARKER = Symbol("OPEN_SQUARE_MARKER");
// Likely ]
const CLOSE_SQUARE_MARKER = Symbol("CLOSE_SQUARE_MARKER");
// Likely ◊
const COMMAND_START_MARKER = Symbol("COMMAND_START_MARKER");

const DEFAULT_CHAR_CFG: CharConfiguration = {
    specialChar: "◊",
    commentMarkerChar: ";",
    openCurlyChar: "{",
    closeCurlyChar: "}",
    openSquareChar: "[",
    closeSquareChar: "]",
    specialBraceChar: "|",
};

class ParserError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, ParserError.prototype);
    }
}

type ParserToken = string | symbol;

enum AstNodeKind {
    AstStrNode = "AstStrNode",
    AstCommandNode = "AstCommandNode",
    AstRootNode = "AstRootNode",
}

interface AstStrNode {
    kind: AstNodeKind.AstStrNode;
    content: string;
    sourceStartCol: number; // Counts from 1.
    sourceStartLine: number; // Counts from 1.
}

interface AstCommandNode {
    kind: AstNodeKind.AstCommandNode;
    commandName: string;
    curlyArg: AstNode[] | undefined;
}

interface AstRootNode {
    kind: AstNodeKind.AstRootNode;
    subNodes: AstNode[];
}

type AstNode = AstStrNode | AstCommandNode | AstRootNode;

interface ParserState {
    data: string;
    currIdx: number;
    currPosLine: number;
    currPosCol: number;
    charCfg: CharConfiguration;
}

interface CharConfiguration {
    specialChar: string;
    commentMarkerChar: string;
    openCurlyChar: string;
    closeCurlyChar: string;
    specialBraceChar: string;
    openSquareChar: string;
    closeSquareChar: string;
}

// TODO: Handle tabbing / spaces better.
// How should I handle it is a good question?
// Perhaps by having that be a special propriety of the newline?
// Pollen seems to treat tabs (and spaces) before text as a different string,
// tabs after are ignored, and empty lines with only spaces are completely
// discarded.
//
// perhaps make this customizable?
// Recall that inside commands we will need to allow some customizable?
// indentation ignoring
//
// To be honest, this may be better as a separate facility, run at the end
// (after all other steps, not before). Besides, depending on export target,
// it may not even matter (we may end up using uniform handling of white space).

/** Parse the LaPoL code into an AST, return root of this AST. */
export function parse(input: string): AstRootNode {
    let parserState: ParserState = {
        data: input,
        currIdx: 0,
        currPosLine: 1,
        currPosCol: 1,
        charCfg: DEFAULT_CHAR_CFG,
    };
    let contents = parseText(parserState, true);

    let rootNode: AstRootNode = {
        kind: AstNodeKind.AstRootNode,
        subNodes: contents,
    };

    return rootNode;
}

/** Recursively parse the text */
function parseText(parserState: ParserState, rootContext: boolean = false): AstNode[] {
    let specialChar = parserState.charCfg.specialChar;
    let commentMarkerChar = parserState.charCfg.commentMarkerChar;
    let openCurlyChar = parserState.charCfg.openCurlyChar;
    let closeCurlyChar = parserState.charCfg.closeCurlyChar;
    let specialBraceChar = parserState.charCfg.specialBraceChar;

    let contents: AstNode[] = [];
    let strAcc = "";
    let strAccStartLine = 1;
    let strAccStartCol = 1;

    function addToStrAcc(char: string) {
        if (strAcc === "") {
            strAccStartLine = parserState.currPosLine;
            strAccStartCol = parserState.currPosCol;
        }
        strAcc += char;
    }

    function finishStrAcc() {
        if (strAcc !== "") {
            contents.push({
                kind: AstNodeKind.AstStrNode,
                content: strAcc,
                sourceStartCol: strAccStartCol,
                sourceStartLine: strAccStartLine,
            });
            strAcc = "";
        }
    }

    let curlyBal = 0;

    while (true) {
        let currTok = currToken(parserState);
        if (currTok === EOF_MARKER) {
            finishStrAcc();
            break;
        } else if (currTok === LINE_COMMENT_START_MARKER) {
            parseLineComment(parserState);
        } else if (currTok === BLOCK_COMMENT_START_MARKER) {
            parseBlockComment(parserState);
        } else if (currTok === OPEN_SQUARE_MARKER || currTok === CLOSE_SQUARE_MARKER) {
            addToStrAcc(currTokenStr(parserState));
        } else if (currTok === OPEN_CURLY_MARKER) {
            curlyBal++;
            addToStrAcc(currTokenStr(parserState));
            advanceToken(parserState);
        } else if (currTok === CLOSE_CURLY_MARKER) {
            curlyBal--;

            if (curlyBal < 0) {
                // TODO: How to detect main context vs sub context?
                if (rootContext) {
                    throw new ParserError("Unexpected close brace in main context");
                } else {
                    finishStrAcc();
                    advanceToken(parserState);
                    return contents;
                }
            } else {
                addToStrAcc(currTokenStr(parserState));
            }

            advanceToken(parserState);
        } else if (currTok === COMMAND_START_MARKER) {
            finishStrAcc();
            let cmd = parseCommand(parserState);
            contents.push(cmd);
        } else if (currTok === "\n") {
            // Newline handling
            finishStrAcc();
            contents.push({
                kind: AstNodeKind.AstStrNode,
                content: "\n",
                sourceStartCol: parserState.currPosCol,
                sourceStartLine: parserState.currPosLine,
            });
            advanceToken(parserState);
        } else {
            assert(typeof currTok === "string"); // All symbols should be matched above.
            addToStrAcc(currTok);
            advanceToken(parserState);
        }
    }

    assert(curlyBal === 0);

    return contents;
}

// function parseCommand(parserState: ParserState): AstNode[] {}

/** "Parses" a line comment by advancing until \n is reached. Note
 *  that \n IS NOT emitted after a line comment. If a newline is required,
 *  use a block comment (i.e. with braces) instead.
 *
 *  Any braces inside are ignored and irrelevant. Balance not required.
 */
function parseLineComment(parserState: ParserState) {
    assert(currToken(parserState) === LINE_COMMENT_START_MARKER);

    while (currToken(parserState) !== "\n") {
        advanceToken(parserState);
    }
    advanceToken(parserState);
}

function parseBlockComment(parserState: ParserState) {
    assert(currToken(parserState) === BLOCK_COMMENT_START_MARKER);
    advanceToken(parserState);
    assert(currToken(parserState) === OPEN_CURLY_MARKER);
    advanceToken(parserState);

    let curlyBal = 1;

    do {
        let currTok = currToken(parserState);
        if (currTok === OPEN_CURLY_MARKER) curlyBal++;
        if (currTok === CLOSE_CURLY_MARKER) curlyBal--;
        if (currTok === EOF_MARKER) throw new ParserError("Unexpected EOF in Block Comment.");
        advanceToken(parserState);
    } while (curlyBal > 0);
}

function parseCommand(parserState: ParserState): AstCommandNode {
    assert(currToken(parserState) === COMMAND_START_MARKER);
    advanceToken(parserState);

    let cmdName = parseCommandName(parserState);

    consumeWhitespaceAndComments(parserState);

    let currTok = currToken(parserState);
    if (currTok !== OPEN_CURLY_MARKER) {
        return { kind: AstNodeKind.AstCommandNode, commandName: cmdName, curlyArg: undefined };
    }

    advanceToken(parserState);
    let curlyArgs = parseText(parserState);
    return { kind: AstNodeKind.AstCommandNode, commandName: cmdName, curlyArg: curlyArgs };
}

function parseCommandName(parserState: ParserState): string {
    let name = "";
    while (true) {
        let currTok = currToken(parserState);
        if (typeof currTok === "string") {
            if (isWhitespace(currTok)) {
                if (name === "") throw new ParserError("Empty Command name.");
                return name;
            } else {
                name += currTok;
                advanceToken(parserState);
            }
        } else {
            if (name === "") throw new ParserError("Empty Command name.");
            return name;
        }
    }
}

function consumeWhitespaceAndComments(parserState: ParserState) {
    let currTok = currToken(parserState);
    while (
        (typeof currTok === "string" && isWhitespace(currTok)) ||
        currTok === LINE_COMMENT_START_MARKER ||
        currTok === BLOCK_COMMENT_START_MARKER
    ) {
        if (currTok === LINE_COMMENT_START_MARKER) {
            parseLineComment(parserState);
        } else if (currTok === BLOCK_COMMENT_START_MARKER) {
            parseBlockComment(parserState);
        } else {
            advanceToken(parserState);
        }
        currTok = currToken(parserState);
    }
}

function consumeWhitespace(parserState: ParserState) {
    let currTok = currToken(parserState);
    while (typeof currTok === "string" && isWhitespace(currTok)) {
        advanceToken(parserState);
        currTok = currToken(parserState);
    }
}

/** Returns the currently "pointed at" token.
 *  TODO: Consider context */
function currToken(parserState: ParserState) {
    let [t] = currTokenMeta(parserState);
    return t;
}

function currTokenStr(parserState: ParserState) {
    let [, , s] = currTokenMeta(parserState);
    return s;
}

/** Returns a tuple comprised of the ParserToken; and the textual length of the token; and the
 *  matched string (or "" for EOF).
 *  TODO: Consider context  */
function currTokenMeta(parserState: ParserState): [ParserToken, number, string] {
    let cfg = parserState.charCfg;

    let c = peekChar(parserState);
    if (c === EOF_MARKER) {
        return [EOF_MARKER, 0, ""];
    } else if (c === "\r") {
        assert(peekChar(parserState, 1) === "\n");
        return ["\n", 2, "\r\n"];
    } else if (c === "\n") {
        return ["\n", 1, "\n"];
    } else if (c === cfg.specialChar) {
        if (peekChar(parserState, 1) === cfg.commentMarkerChar) {
            if (peekChar(parserState, 2) === cfg.openCurlyChar) {
                return [BLOCK_COMMENT_START_MARKER, 2, cfg.specialChar + cfg.commentMarkerChar];
            } else {
                return [LINE_COMMENT_START_MARKER, 2, cfg.specialChar + cfg.commentMarkerChar];
            }
        } else {
            return [COMMAND_START_MARKER, 1, cfg.specialChar];
        }
    } else if (c === cfg.specialBraceChar) {
        throw new ParserError("Special braces not yet implemented!");
    } else if (c === cfg.openCurlyChar) {
        return [OPEN_CURLY_MARKER, 1, cfg.openCurlyChar];
    } else if (c === cfg.closeCurlyChar) {
        return [CLOSE_CURLY_MARKER, 1, cfg.closeCurlyChar];
    } else if (c === cfg.openSquareChar) {
        return [OPEN_SQUARE_MARKER, 1, cfg.openSquareChar];
    } else if (c === cfg.closeSquareChar) {
        return [CLOSE_SQUARE_MARKER, 1, cfg.closeSquareChar];
    } else {
        assert(typeof c === "string");
        return [c, 1, c];
    }
}

function advanceToken(parserState: ParserState) {
    let [t, len] = currTokenMeta(parserState);

    if (t === "\n") {
        parserState.currPosCol = 1;
        parserState.currPosLine++;
    } else {
        parserState.currPosCol++;
    }

    parserState.currIdx += len;
}

/** Return the character at index `<current parser index> + relativeIndex`,
 *  or EOF_MARKER if after end of file.
 */
function peekChar(parserState: ParserState, relativeIndex: number = 0): string | symbol {
    if (parserState.currIdx + relativeIndex < parserState.data.length) {
        let out = parserState.data[parserState.currIdx + relativeIndex];
        return out;
    } else {
        return EOF_MARKER;
    }
}
