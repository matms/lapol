const EOF_MARKER = "EOF";
const DEFAULT_SPECIAL_CHARACTER = "◊";

enum AstNodeKind {
    AstStrNode = "AstStrNode",
    AstCommandNode = "AstCommandNode",
    AstRootNode = "AstRootNode",
}

interface AstStrNode {
    kind: AstNodeKind.AstStrNode;
    content: string;
    source_start_col: number; // Counts from 1.
    source_start_line: number; // Counts from 1.
}

interface AstCommandNode {
    kind: AstNodeKind.AstCommandNode;
    command_name: string;
    sub_nodes: AstNode[];
}

interface AstRootNode {
    kind: AstNodeKind.AstRootNode;
    sub_nodes: AstNode[];
}

type AstNode = AstStrNode | AstCommandNode | AstRootNode;

interface ParserState {
    data: string;
    curr_idx: number;
    curr_pos_line: number;
    curr_pos_col: number;
    special_char: string;
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
// TO be honest, this may be better as a separate facility, run at the end
// (after all other steps, not before). Besides, depending on export target,
// it may not even matter (we may end up using uniform handling of white space).

/** Parse the LaPoL code into an AST, return root of this AST. */
export function parse(input: string): AstRootNode {
    let parser_state: ParserState = {
        data: input,
        curr_idx: 0,
        curr_pos_line: 1,
        curr_pos_col: 1,
        special_char: DEFAULT_SPECIAL_CHARACTER,
    };
    let contents = parse_text(parser_state);

    let root_node: AstRootNode = {
        kind: AstNodeKind.AstRootNode,
        sub_nodes: contents,
    };

    return root_node;
}

/** Recursively parse the text */
function parse_text(parser_state: ParserState): AstNode[] {
    let special_char = parser_state.special_char;
    let contents: AstNode[] = [];
    let str_acc = "";
    let str_acc_start_line = 1;
    let str_acc_start_col = 1;

    function add_to_str_acc(char: string) {
        if (str_acc === "") {
            str_acc_start_line = parser_state.curr_pos_line;
            str_acc_start_col = parser_state.curr_pos_col;
        }
        str_acc += char;
    }

    function finish_str_acc() {
        if (str_acc !== "") {
            contents.push({
                kind: AstNodeKind.AstStrNode,
                content: str_acc,
                source_start_col: str_acc_start_col,
                source_start_line: str_acc_start_line,
            });
            str_acc = "";
        }
    }

    while (true) {
        let next_c = peek_char(parser_state);
        if (next_c === special_char) {
            // TODO
        } else if (next_c === EOF_MARKER) {
            finish_str_acc();
            break;
        } else if (next_c === "\r") {
            advance_char(parser_state);
            if (!peek_char(parser_state)) {
                throw Error("Parser Error: \\r not followed by \\n.");
            }
        } else if (next_c === "\n") {
            // TODO: Do I have to worry about '\r\n' in JS?
            finish_str_acc();
            contents.push({
                kind: AstNodeKind.AstStrNode,
                content: "\n",
                source_start_col: parser_state.curr_pos_col,
                source_start_line: parser_state.curr_pos_line,
            });
            if (!advance_char(parser_state)) break;
        } else {
            add_to_str_acc(next_c);
            if (!advance_char(parser_state)) break;
        }
    }

    return contents;
}

/** Advance Character. Returns true on success and false on EOF. */
function advance_char(parser_state: ParserState): boolean {
    if (parser_state.curr_idx < parser_state.data.length) {
        if (peek_char(parser_state) === "\r") {
            // Do NOT change curr_pos_col.
        } else if (peek_char(parser_state) === "\n") {
            parser_state.curr_pos_col = 1;
            parser_state.curr_pos_line++;
        } else {
            parser_state.curr_pos_col++;
        }
        parser_state.curr_idx++;
        return true;
    } else {
        parser_state.curr_idx++;
        return false; // Indicates EOF
    }
}

function peek_char(parser_state: ParserState): string {
    if (parser_state.curr_idx < parser_state.data.length) {
        let out = parser_state.data[parser_state.curr_idx];
        return out;
    } else {
        return EOF_MARKER;
    }
}
