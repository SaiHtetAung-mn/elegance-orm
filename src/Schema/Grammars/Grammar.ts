import Connection from "../../Connection/Connection";
import { firstCharUppercase, methodExists } from "../../utils/general";
import Blueprint from "../Blueprint";
import ColumnDefinition from "../ColumnDefinition";
import Command from "../Command";
import ForeignCommand from "../ForeignCommand";

abstract class Grammar {
    protected modeifiers: string[] = [];

    protected abstract compileCreate(blueprint: Blueprint, command: Command): string;
    protected abstract compileForeign(blueprint: Blueprint, command: ForeignCommand): string;
    protected abstract compilePrimary(blueprint: Blueprint, command: Command): string;
    protected abstract compileUnique(blueprint: Blueprint, command: Command): string;
    protected abstract compileIndex(blueprint: Blueprint, command: Command): string;
    protected abstract compileDrop(blueprint: Blueprint, command: Command): string;
    protected abstract compileDropIfExists(blueprint: Blueprint, command: Command): string;
    protected abstract compileDropPrimary(blueprint: Blueprint, command: Command): string;
    protected abstract compileDropUnique(blueprint: Blueprint, command: Command): string;
    protected abstract compileDropIndex(blueprint: Blueprint, command: Command): string;

    // get column with type and modifiers
    protected getColumns(blueprint: Blueprint): Array<string> {
        return blueprint.getColumns().map(column => {
            let sql = this.wrapValue(column.getColumn()) + " " + this.getType(column);
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
    protected typeUuid(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the uuid type.")
    }

    protected typeInteger(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the integer type.")
    }

    protected typeTinyInteger(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the tinyinteger type.")
    }

    protected typeBigInteger(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the big integr type.")
    }

    protected typeSmallInteger(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the small integer type.")
    }

    protected typeChar(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the char type.")
    }

    protected typeString(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the varchar type.")
    }

    protected typeText(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the text type.")
    }

    protected typeLongText(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the long text type.")
    }

    protected typeFloat(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the float type.")
    }

    protected typeDouble(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the double type.")
    }

    protected typeBoolean(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the boolean type.")
    }

    protected typeDate(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the date type.")
    }

    protected typeDateTime(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the date-time type.")
    }

    protected typeTime(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the time type.")
    }

    protected typeTimestamp(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the timestamp type.")
    }

    protected typeYear(column: ColumnDefinition): string {
        throw new Error("This database driver does not support year type");
    }

    protected typeJson(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the json type.")
    }

    protected typeBinary(column: ColumnDefinition): string {
        throw new Error("This database driver does not support the binary type.")
    }

    protected hasCommand(blueprint: Blueprint, name: TCommandName): boolean {
        return blueprint
            .getCommands()
            .some(cmd => cmd.name == name);
    }

    protected wrapTable(value: string): string {
        return "`" + value + "`"
    }

    protected wrapValue(value: string): string {
        if (value === '*')
            return value;

        return '`' + value.replace(/`/g, '``') + '`';
    }
}

export default Grammar;