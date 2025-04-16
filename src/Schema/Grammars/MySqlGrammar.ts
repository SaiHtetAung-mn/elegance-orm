import Connection from "../../Connection/Connection";
import Blueprint from "../Blueprint";
import ColumnDefinition from "../ColumnDefinition";
import Command from "../Command";
import Grammar from "./Grammar";

class MySqlGrammar extends Grammar {
    protected modeifiers = [
        'Unsigned', 'Nullable', 'Default', 'OnUpdate', 'Increment', 'Comment', 'After', 'First',
    ]

    compileCreate(blueprint: Blueprint, command: Command): string {
        const tableStructures = this.getColumns(blueprint);
    }

    /**************************** type methods ****************/
    protected typeUuid(column: ColumnDefinition): string {
        return "char(36)";
    }

    protected typeInteger(column: ColumnDefinition): string {
        return "int"
    }

    protected typeTinyInteger(column: ColumnDefinition): string {
        return "tinyint";
    }

    protected typeBigInteger(column: ColumnDefinition): string {
        return "bigint";
    }

    protected typeSmallInteger(column: ColumnDefinition): string {
        return "smallint";
    }

    protected typeChar(column: ColumnDefinition): string {
        return `char(${column.getAttribute("length")})`;
    }

    protected typeString(column: ColumnDefinition): string {
        return `varchar(${column.getAttribute("length")})`;
    }

    protected typeText(column: ColumnDefinition): string {
        return "text";
    }

    protected typeLongText(column: ColumnDefinition): string {
        return "longtext";
    }

    protected typeFloat(column: ColumnDefinition): string {
        return `float(${column.getAttribute("precision")})`;
    }

    protected typeDouble(column: ColumnDefinition): string {
        return "double";
    }

    protected typeBoolean(column: ColumnDefinition): string {
        return "tinyint(1)";
    }

    protected typeDate(column: ColumnDefinition): string {
        return "date";
    }

    protected typeDateTime(column: ColumnDefinition): string {
        const currentVal = "CURRENT_TIMESTAMP";

        if (column.getAttribute("useCurrent")) {
            column.default(currentVal);
        }

        if (column.getAttribute("useCurrentOnUpdate")) {
            column.onUpdate(currentVal);
        }

        return "datetime";
    }

    protected typeTime(column: ColumnDefinition): string {
        return "time";
    }

    protected typeTimestamp(column: ColumnDefinition): string {
        const currentVal = "CURRENT_TIMESTAMP";

        if (column.getAttribute("useCurrent")) {
            column.default(currentVal);
        }

        if (column.getAttribute("useCurrentOnUpdate")) {
            column.onUpdate(currentVal);
        }

        return "timestamp";
    }

    protected typeYear(column: ColumnDefinition): string {
        return "year";
    }

    protected typeJson(column: ColumnDefinition): string {
        return "json";
    }

    protected typeBinary(column: ColumnDefinition): string {
        return "blob";
    }

    /**************************** modifier methods ****************/
    protected modifyUnsigned(blueprint: Blueprint, column: ColumnDefinition): string {

    }

    protected modifyNullable(blueprint: Blueprint, column: ColumnDefinition): string {

    }

    protected modifyDefault(blueprint: Blueprint, column: ColumnDefinition): string {

    }

    protected modifyOnUpdate(blueprint: Blueprint, column: ColumnDefinition): string {

    }

    protected modifyIncrement(blueprint: Blueprint, column: ColumnDefinition): string {

    }

    protected modifyComment(blueprint: Blueprint, column: ColumnDefinition): string {

    }

    protected modifyAfter(blueprint: Blueprint, column: ColumnDefinition): string {

    }

    protected modifyFirst(blueprint: Blueprint, column: ColumnDefinition): string {

    }
}

export default MySqlGrammar;