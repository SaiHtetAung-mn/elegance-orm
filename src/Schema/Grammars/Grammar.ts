import Connection from "../../Connection/Connection";
import Blueprint from "../Blueprint";
import Command from "../Command";

abstract class Grammar {
    compileCreateTable(blueprint: Blueprint, command: Command): string {
        return "";
    }
}

export default Grammar;