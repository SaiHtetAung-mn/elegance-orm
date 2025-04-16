import Connection from "../../Connection/Connection";
import { firstCharUppercase, methodExists } from "../../utils/general";
import Blueprint from "../Blueprint";
import ColumnDefinition from "../ColumnDefinition";
import Command from "../Command";

abstract class Grammar {
    protected modeifiers: string[] = [];

    // get column with type and modifiers
    protected getColumns(blueprint: Blueprint): Array<string> {
        return blueprint.getColumns().map(column => {
            let sql = this.wrapTable(blueprint.getTable()) + " " + this.getType(column);
            this.addModifiers(sql, column);

            return sql;
        })
    }

    // get column type
    protected getType(column: ColumnDefinition): string {
        return (this as any)[`type${firstCharUppercase(column.getType())}`](column);
    }

    // add modifiers to each column
    protected addModifiers(sql: string, column: ColumnDefinition): string {
        this.modeifiers.forEach(modifier => {
            const method = `modify${firstCharUppercase(modifier)}`;
            if (methodExists(this, method)) {
                sql += (this as any)[method](column);
            }
        })

        return sql;
    }

    /**************************** type methods ****************/
    protected typeUuid(column: ColumnDefinition) {
        throw new Error("This database driver does not support the uuid type.")
    }

    protected typeInteger(column: ColumnDefinition) {
        throw new Error("This database driver does not support the integer type.")
    }

    protected typeTinyInteger(column: ColumnDefinition) {
        throw new Error("This database driver does not support the tinyinteger type.")
    }

    protected typeBigInteger(column: ColumnDefinition) {
        throw new Error("This database driver does not support the big integr type.")
    }

    protected typeSmallInteger(column: ColumnDefinition) {
        throw new Error("This database driver does not support the small integer type.")
    }

    protected typeChar(column: ColumnDefinition) {
        throw new Error("This database driver does not support the char type.")
    }

    protected typeString(column: ColumnDefinition) {
        throw new Error("This database driver does not support the varchar type.")
    }

    protected typeText(column: ColumnDefinition) {
        throw new Error("This database driver does not support the text type.")
    }

    protected typeLongText(column: ColumnDefinition) {
        throw new Error("This database driver does not support the long text type.")
    }

    protected typeFloat(column: ColumnDefinition) {
        throw new Error("This database driver does not support the float type.")
    }

    protected typeDouble(column: ColumnDefinition) {
        throw new Error("This database driver does not support the double type.")
    }

    protected typeBoolean(column: ColumnDefinition) {
        throw new Error("This database driver does not support the boolean type.")
    }

    protected typeDate(column: ColumnDefinition) {
        throw new Error("This database driver does not support the date type.")
    }

    protected typeDateTime(column: ColumnDefinition) {
        throw new Error("This database driver does not support the date-time type.")
    }

    protected typeTime(column: ColumnDefinition) {
        throw new Error("This database driver does not support the time type.")
    }

    protected typeTimestamp(column: ColumnDefinition) {
        throw new Error("This database driver does not support the timestamp type.")
    }

    protected typeJson(column: ColumnDefinition) {
        throw new Error("This database driver does not support the json type.")
    }

    protected typeBinary(column: ColumnDefinition) {
        throw new Error("This database driver does not support the binary type.")
    }

    protected wrapTable(value: string): string {
        return "`" + value + "`"
    }

    /**************************** modifier methods ****************/
    


    protected wrapValue(value: string): string {
        if (value === '*') 
            return value;

        return '`' + value.replace(/`/g, '``') + '`';
    }
}

export default Grammar;