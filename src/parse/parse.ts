import { strict as assert } from "assert";
import { syncBuiltinESMExports } from "node:module";
import { type } from "node:os";
import { isWhitespace } from "../utils";
import { AstNode, AstNodeKind, AstCommandNode, AstRootNode, AstStrNode } from "../ast";
import { ParserError } from "../errors";

// End of file
const EOF_MARKER = Symbol("EOF");
// Likely ◊%
const LINE_COMMENT_START_MARKER = Symbol("LINE_COMMENT_START");
// Likely ◊% followed by opening brace. Note opening brace is NOT matched here.
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
// Likely ;
const COMMAND_FORCE_END_MARKER = Symbol("COMMAND_FORCE_END_MARKER");

const DEFAULT_CHAR_CFG: CharConfiguration = {
    specialChar: "◊",
    commentMarkerChar: "%",
    openCurlyChar: "{",
    closeCurlyChar: "}",
    openSquareChar: "[",
    closeSquareChar: "]",
    specialBraceChar: "|",
    commandForceEndChar: ";",
};

type ParserToken = string | symbol;

interface ParserState {
    data: string;
    currIdx: number;
    currPosLine: number;
    currPosCol: number;
    charCfg: CharConfiguration;
    currTokenMetaCache: [ParserToken, number, string] | undefined;
}

interface CharConfiguration {
    specialChar: string;
    commentMarkerChar: string;
    openCurlyChar: string;
    closeCurlyChar: string;
    specialBraceChar: string;
    openSquareChar: string;
    closeSquareChar: string;
    commandForceEndChar: string;
}

interface ParserRollbackPoint {
    idx: number;
    posLine: number;
    posCol: number;
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

/** Parse the LaPoL code (given as the string `input`) into an AST, return root of this AST.*/
// TODO: Read input gradually; Use async.
// TODO: Use async to optimize
export async function parse(input: string): Promise<AstRootNode> {
    let parserState: ParserState = {
        data: input,
        currIdx: 0,
        currPosLine: 1,
        currPosCol: 1,
        charCfg: DEFAULT_CHAR_CFG,
        currTokenMetaCache: undefined,
    };
    let contents = parseText(parserState, true);

    let rootNode: AstRootNode = {
        kind: AstNodeKind.AstRootNode,
        subNodes: contents,
    };

    return rootNode;
}

/** Recursively parse the text.
 *
 * This is used for the "main" body of text, and also for textual parameters given within curly
 * braces.
 */
function parseText(parserState: ParserState, rootContext: boolean = false): AstNode[] {
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
        } else if (
            currTok === OPEN_SQUARE_MARKER ||
            currTok === CLOSE_SQUARE_MARKER ||
            currTok === COMMAND_FORCE_END_MARKER
        ) {
            addToStrAcc(currTokenStr(parserState));
            advanceToken(parserState);
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

/** NOT PROPERLY IMPLEMENTED YET. TODO! */
function parseSquareArg(parserState: ParserState): AstNode[] {
    let contents: AstNode[] = [];

    let squareBal = 0;

    while (true) {
        let currTok = currToken(parserState);
        if (currTok === EOF_MARKER) {
            throw new ParserError("Unexpected EOF in Square Brace context.");
        } else if (currTok === LINE_COMMENT_START_MARKER) {
            parseLineComment(parserState);
        } else if (currTok === BLOCK_COMMENT_START_MARKER) {
            parseBlockComment(parserState);
        } else if (currTok === OPEN_SQUARE_MARKER) {
            squareBal++;
            advanceToken(parserState);
        } else if (currTok === CLOSE_SQUARE_MARKER) {
            squareBal--;

            advanceToken(parserState);

            if (squareBal < 0) {
                return contents;
            }
        } else {
            // TODO
            advanceToken(parserState);
        }
    }
}

/** "Parses" a line comment by advancing until \n is reached. Note
 *  that \n IS NOT emitted after a line comment. If a newline is required,
 *  use a block comment (i.e. with braces) instead.
 *
 *  Any braces inside are ignored and irrelevant. Balance not required.
 *
 * Note that while line and block comment syntax looks a lot like command call syntax,
 * they have some differences. Notably, you cannot have a space between "◊;" and "{}" if
 * you want a block comment, because if you have a space there, it gets parsed as a line
 * comment instead.
 */
function parseLineComment(parserState: ParserState) {
    assert(currToken(parserState) === LINE_COMMENT_START_MARKER);

    while (currToken(parserState) !== "\n") {
        advanceToken(parserState);
    }
    advanceToken(parserState);
}

/** Parses a Block Comment.
 *
 * Braces inside must be balanced.
 *
 * Note that while line and block comment syntax looks a lot like command call syntax,
 * they have some differences. Notably, you cannot have a space between "◊;" and "{}" if
 * you want a block comment, because if you have a space there, it gets parsed as a line
 * comment instead. */
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

/** Parses a command.
 *
 * TODO: Handle square argument properly (instead of simply discarding them).
 */
// TODO HANDLE SQUARE ARGS.
function parseCommand(parserState: ParserState): AstCommandNode {
    assert(currToken(parserState) === COMMAND_START_MARKER);
    advanceToken(parserState);

    // COMMAND NAME
    let cmdName = parseCommandName(parserState);
    let squareArg: AstNode[] | undefined = undefined;
    let curlyArgs: AstNode[][] = [];

    // POSSIBLE ONE OFF SQUARE BRACKET.
    square: {
        let rollbackPoint = makeRollbackPoint(parserState);
        consumeWhitespaceAndComments(parserState);
        let currTok = currToken(parserState);
        if (currTok === COMMAND_FORCE_END_MARKER) {
            advanceToken(parserState);
            break square;
        } else if (currTok !== OPEN_SQUARE_MARKER) {
            // Note: We want to avoid redundant backtracking if curly follows immediately.
            if (currTok !== OPEN_CURLY_MARKER) rollbackParser(parserState, rollbackPoint);
            break square;
        } else {
            advanceToken(parserState);
            squareArg = parseSquareArg(parserState);
        }
    }

    // 0 OR MORE CURLY ARGS.
    while (true) {
        let rollbackPoint = makeRollbackPoint(parserState);
        consumeWhitespaceAndComments(parserState);
        let currTok = currToken(parserState);
        if (currTok === COMMAND_FORCE_END_MARKER) {
            advanceToken(parserState);
            break;
        } else if (currTok !== OPEN_CURLY_MARKER) {
            rollbackParser(parserState, rollbackPoint);
            break;
        } else {
            advanceToken(parserState);
            let curlyArg = parseText(parserState);
            curlyArgs.push(curlyArg);
        }
    }

    return {
        kind: AstNodeKind.AstCommandNode,
        commandName: cmdName,
        squareArg: squareArg,
        curlyArgs: curlyArgs,
    };
}

/** Parse a command name. Command names must not have whitespace. */
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

/** Consume (i.e. skip) whitespace or comments (of the line or block variety). */
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

/** Returns the currently "pointed at" token. */
function currToken(parserState: ParserState): ParserToken {
    return currTokenMeta(parserState)[0];
}

/** Returns the textual string originating the currently "pointed at" token. */
function currTokenStr(parserState: ParserState) {
    return currTokenMeta(parserState)[2];
}

/** Returns a tuple comprised of the ParserToken; and the textual length of the token; and the
 *  matched string (or "" for EOF). */
function currTokenMeta(parserState: ParserState): [ParserToken, number, string] {
    if (typeof parserState.currTokenMetaCache === "undefined") {
        parserState.currTokenMetaCache = computeCurrTokenCache(parserState);
    }

    return parserState.currTokenMetaCache;
}

/** (Re)compute the current token cache. This needs to be done if the token has been advanced.
 *
 * However, do not call it directly; This called only by currTokenMeta().
 *
 * If token recomputation is needed, invalidate the cache (by setting it to `undefined`) instead.
 */
function computeCurrTokenCache(parserState: ParserState): [ParserToken, number, string] {
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
    } else if (c === cfg.commandForceEndChar) {
        return [COMMAND_FORCE_END_MARKER, 1, cfg.commandForceEndChar];
    } else {
        assert(typeof c === "string");
        return [c, 1, c];
    }
}

/** Advance the currently pointed at token. Note this may advance more than one character,
 * if the current token is longer than one character.
 *
 * This also updates `currPosCol` and `currPosLine`.
 */
function advanceToken(parserState: ParserState) {
    let [t, len] = currTokenMeta(parserState);

    if (t === "\n") {
        parserState.currPosCol = 1;
        parserState.currPosLine++;
    } else {
        parserState.currPosCol++;
    }

    parserState.currIdx += len;
    // Invalidade currTokenMetaCache.
    parserState.currTokenMetaCache = undefined;
}

/** Return a `ParserRollbackPoint` that can be used to rollback (or backtrack) the parser to the
 * current position.
 *
 * To execute a rollback, see `rollbackParser`.
 */
function makeRollbackPoint(parserState: ParserState): ParserRollbackPoint {
    return {
        idx: parserState.currIdx,
        posCol: parserState.currPosCol,
        posLine: parserState.currPosLine,
    };
}

/** Rollback the parser (i.e. backtrack) to a previously generated rollback point.
 *
 * To generate a rollback point, see `makeRollbackPoint`.
 */
function rollbackParser(parserState: ParserState, rollbackPoint: ParserRollbackPoint) {
    parserState.currIdx = rollbackPoint.idx;
    parserState.currPosCol = rollbackPoint.posCol;
    parserState.currPosLine = rollbackPoint.posLine;

    // Invalidade currTokenMetaCache.
    parserState.currTokenMetaCache = undefined;
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
