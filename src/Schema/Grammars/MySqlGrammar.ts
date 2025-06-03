import Connection from "../../Connection/Connection";
import { sprintf } from "../../utils/general";
import Blueprint from "../Blueprint";
import ColumnDefinition from "../ColumnDefinition";
import Command from "../Command";
import ForeignCommand from "../ForeignCommand";
import Grammar from "./Grammar";

class MySqlGrammar extends Grammar {
    protected modeifiers = [
        'Unsigned', 'Nullable', 'Default', 'OnUpdate', 'Increment', 'Comment', 'After', 'First',
    ];

    protected $serials = ['bigInteger', 'integer', 'mediumInteger', 'smallInteger', 'tinyInteger'];

    protected compileCreate(blueprint: Blueprint, command: Command): string {
        const tableStructures: string[] = this.getColumns(blueprint);

        // extract first primary command 
        const primaryCommand = blueprint.getCommands().find(cmd => cmd.name === "primary");
        if (primaryCommand) {
            const pkColumns: string = this.columnize(primaryCommand.columns);

            tableStructures.push(`primary key (${pkColumns})`);
            primaryCommand.shouldBeSkipped = true;
        }

        return sprintf(
            "create table %s (%s)",
            this.wrapTable(blueprint.getTable()),
            tableStructures.join(", ")
        )
    }

    protected compileForeign(blueprint: Blueprint, command: ForeignCommand): string {
        let sql = sprintf(
            "alter table %s add constraint %s ",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName)
        );

        sql += sprintf(
            "foreign key (%s) references %s (%s)",
            this.columnize(command.columns),
            this.wrapTable(command.referenceTable),
            this.columnize([command.referenceColumn])
        );

        return sql;
    }

    protected compileUnique(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "alter table %s add unique %s (%s)",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName),
            this.columnize(command.columns)
        )
    }

    protected compilePrimary(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "alter table %s add primary key %s (%s)",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName),
            this.columnize(command.columns)
        )
    }

    protected compileIndex(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "alter table %s add index %s (%s)",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName),
            this.columnize(command.columns)
        )
    }

    protected compileDropPrimary(blueprint: Blueprint, command: Command): string {
        return `alter table ${this.wrapTable(blueprint.getTable())} drop primary key`;
    }

    protected compileDropUnique(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "alter table %s drop unique %s",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName)
        )
    }

    protected compileDropIndex(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "alter table %s drop index %s",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName)
        )
    }

    protected compileDrop(blueprint: Blueprint, command: Command): string {
        return `drop table ${this.wrapTable(blueprint.getTable())}`;
    }

    protected compileDropIfExists(blueprint: Blueprint, command: Command): string {
        return `drop table if exists ${this.wrapTable(blueprint.getTable())}`;
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
        if (column.getAttribute("unsigned")) {
            return " unsigned";
        }

        return "";
    }

    protected modifyNullable(blueprint: Blueprint, column: ColumnDefinition): string {
        return column.getAttribute("nullable") ? " null" : " not null";
    }

    protected modifyDefault(blueprint: Blueprint, column: ColumnDefinition): string {
        if (column.getAttribute("default") !== undefined) {
            return ` default ${column.getAttribute("default")}`;
        }

        return "";
    }

    protected modifyOnUpdate(blueprint: Blueprint, column: ColumnDefinition): string {
        if (column.getAttribute("onUpdate") !== undefined) {
            return ` on update ${column.getAttribute("onUpdate")}`;
        }

        return "";
    }

    protected modifyIncrement(blueprint: Blueprint, column: ColumnDefinition): string {
        if (this.$serials.includes(column.getType()) && column.getAttribute("autoIncrement")) {
            return this.hasCommand(blueprint, "primary")
                ? " auto_increment"
                : " auto_increment primary key"
        }

        return "";
    }

    protected modifyComment(blueprint: Blueprint, column: ColumnDefinition): string {
        if (column.getAttribute("comment")) {
            return " comment" + "'" + this.addSlashes(column.getAttribute("comment")) + "'";
        }

        return "";
    }

    protected modifyAfter(blueprint: Blueprint, column: ColumnDefinition): string {
        if (column.getAttribute("after") !== undefined) {
            return ` after ${this.wrapValue(column.getAttribute("after"))}`
        }

        return "";
    }

    protected modifyFirst(blueprint: Blueprint, column: ColumnDefinition): string {
        if (column.getAttribute("first") !== undefined) {
            return " first";
        }

        return "";
    }

    private addSlashes(str: string) {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\0/g, '\\0');
    }

    private columnize(columns: string[]): string {
        return columns.map(col => this.wrapValue(col)).join(", ");
    }
}

export default MySqlGrammar;