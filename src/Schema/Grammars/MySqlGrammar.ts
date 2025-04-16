import Connection from "../../Connection/Connection";
import Blueprint from "../Blueprint";
import ColumnDefinition from "../ColumnDefinition";
import Command from "../Command";
import Grammar from "./Grammar";

class MySqlGrammar extends Grammar {
    protected modeifiers = [
        'Unsigned', 'Nullable', 'Default', 'Increment', 'Comment', 'After', 'First',
    ]

    compileCreate() {
        const tableStructures = this.getColumns();
    }

    /**************************** type methods ****************/
    protected typeChar(column: ColumnDefinition) {
        return `char(${column.getAttribute("length")})`;
    }
}

export default MySqlGrammar;