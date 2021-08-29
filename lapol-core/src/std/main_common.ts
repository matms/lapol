import { FileModuleStorage, LtrfObj } from "../mod";

export interface MainFileStore extends FileModuleStorage {
    count: number;
    title: readonly LtrfObj[];
    author: readonly LtrfObj[];
}
