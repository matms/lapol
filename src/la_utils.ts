
import * as fs from 'fs';

/** Synchronously read the file with path `file_path`. */
export function read_file_at_once(file_path: string): string {
    let data = fs.readFileSync(file_path, {encoding: 'utf8', flag: 'r'})
    return data
}

/** Synchronously write (override) the file with path `file_path`. */
export function write_file_at_once(path: string, data: string) {
    fs.writeFileSync(path, data, {encoding: 'utf8'})
}