import { strict as assert } from "assert";

const EOF_MARKER = Symbol("EOF");

const DEFAULT_CHAR_CFG: CharConfiguration = {
    specialChar: "◊",
    commentMarkerChar: ";",
    openCurlyChar: "{",
    closeCurlyChar: "}",
    specialBraceChar: "|",
};

class ParserError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, ParserError.prototype);
    }
}

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
    subNodes: AstNode[];
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
    contextStack: ParserContext[];
}

interface CharConfiguration {
    specialChar: string;
    commentMarkerChar: string;
    openCurlyChar: string;
    closeCurlyChar: string;
    specialBraceChar: string;
}

enum ParserContextKind {
    TextContext = "TextContext",
}

// Denotes regular text. May also be used for block comments (TODO: Update this comment?)
interface TextContext {
    contextKind: ParserContextKind;
    curlyBalance: number;
    escapedMode: boolean;
}

type ParserContext = TextContext;

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
        contextStack: [
            { contextKind: ParserContextKind.TextContext, curlyBalance: 0, escapedMode: false },
        ],
    };
    let contents = parseText(parserState);

    let rootNode: AstRootNode = {
        kind: AstNodeKind.AstRootNode,
        subNodes: contents,
    };

    return rootNode;
}

/** Recursively parse the text */
function parseText(parserState: ParserState): AstNode[] {
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

    let currCtx = parserTopContext(parserState);

    assert(currCtx.contextKind === ParserContextKind.TextContext);
    assert(currCtx.escapedMode === false);

    while (true) {
        let currChar = peekChar(parserState);
        // EOF
        if (typeof currChar === "symbol") {
            if (currChar === EOF_MARKER) {
                finishStrAcc();
                break;
            }
        }
        // ◊ (or other special character)
        else if (currChar === specialChar) {
            let nextChar = peekCharRelative(parserState, 1);
            // ◊ followed by EOF is an error
            if (nextChar === EOF_MARKER) {
                throw new ParserError("EOF after special character");
            }
            // ◊; comment syntax
            else if (nextChar === commentMarkerChar) {
                // Brace comment
                if (peekCharRelative(parserState, 2) === openCurlyChar) {
                    parseBlockComment(parserState);
                }
                // Line comment
                else {
                    parseLineComment(parserState);
                }
            } else {
            }
        }
        // Newline (\r special handler)
        else if (currChar === "\r") {
            advanceChar(parserState);
            if (!peekChar(parserState)) {
                throw new ParserError("Parser Error: \\r not followed by \\n.");
            }
        }
        // Newline (\n)
        else if (currChar === "\n") {
            // TODO: Do I have to worry about '\r\n' in JS?
            finishStrAcc();
            contents.push({
                kind: AstNodeKind.AstStrNode,
                content: "\n",
                sourceStartCol: parserState.currPosCol,
                sourceStartLine: parserState.currPosLine,
            });
            if (!advanceChar(parserState)) break;
        }
        // Open Curly ({)
        else if (currChar === openCurlyChar) {
            currCtx.curlyBalance++;
            addToStrAcc(currChar);
            if (!advanceChar(parserState)) break;
        }
        // Close Curly (})
        else if (currChar === closeCurlyChar) {
            currCtx.curlyBalance--;
            // TODO: HANDLE IF GOES BELOW ZERO (Return unless in main text, in which case,
            // error)!
            if (currCtx.curlyBalance < 0) {
                if (parserState.contextStack.length === 1) {
                    throw new ParserError("Unexpected close brace in main context");
                } else {
                    throw new ParserError("NOT IMPLEMENTED YET");
                }
            } else {
                addToStrAcc(currChar);
            }
            if (!advanceChar(parserState)) break;
        }
        // Regular text
        else {
            addToStrAcc(currChar as string);
            if (!advanceChar(parserState)) break;
        }
    }

    assert(currCtx.curlyBalance === 0);

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
    assert(peekChar(parserState) === parserState.charCfg.specialChar);
    assert(peekCharRelative(parserState, 1) === parserState.charCfg.commentMarkerChar);
    assert(peekCharRelative(parserState, 2) !== parserState.charCfg.openCurlyChar);

    while (peekChar(parserState) !== "\n") {
        if (!advanceChar(parserState)) break;
    }
    advanceChar(parserState);
}

/** "Parses" a block comment. Note braces must be balanced within!
 */
function parseBlockComment(parserState: ParserState) {
    assert(peekChar(parserState) === parserState.charCfg.specialChar);
    assert(peekCharRelative(parserState, 1) === parserState.charCfg.commentMarkerChar);
    assert(peekCharRelative(parserState, 2) === parserState.charCfg.openCurlyChar);

    // Skip ◊;{
    advanceChar(parserState);
    advanceChar(parserState);

    parserState.contextStack.push({
        contextKind: ParserContextKind.TextContext,
        curlyBalance: 0,
        escapedMode: false,
    });

    let currCtx = parserTopContext(parserState);

    do {
        let currChar = peekChar(parserState);
        if (currChar === parserState.charCfg.openCurlyChar) currCtx.curlyBalance++;
        if (currChar === parserState.charCfg.closeCurlyChar) currCtx.curlyBalance--;
        if (!advanceChar(parserState)) break;
    } while (currCtx.curlyBalance > 0);

    if (currCtx.curlyBalance !== 0) {
        throw new ParserError("Eof with unbalanced braces. (parseBlockComment)");
    }
}

function parserTopContext(parserState: ParserState): ParserContext {
    return parserState.contextStack[parserState.contextStack.length - 1];
}

/** Advance Character. Returns true on success and false on EOF. */
function advanceChar(parserState: ParserState): boolean {
    if (parserState.currIdx < parserState.data.length) {
        if (peekChar(parserState) === "\r") {
            // Do NOT change curr_pos_col.
        } else if (peekChar(parserState) === "\n") {
            parserState.currPosCol = 1;
            parserState.currPosLine++;
        } else {
            parserState.currPosCol++;
        }
        parserState.currIdx++;
        return true;
    } else {
        parserState.currIdx++;
        return false; // Indicates EOF
    }
}

function peekChar(parserState: ParserState): string | symbol {
    return peekCharRelative(parserState, 0);
}

/** Return the character at index `<current parser index> + relativeIndex`,
 *  or EOF_MARKER if after end of file.
 */
function peekCharRelative(parserState: ParserState, relativeIndex: number): string | symbol {
    if (parserState.currIdx + relativeIndex < parserState.data.length) {
        let out = parserState.data[parserState.currIdx + relativeIndex];
        return out;
    } else {
        return EOF_MARKER;
    }
}
