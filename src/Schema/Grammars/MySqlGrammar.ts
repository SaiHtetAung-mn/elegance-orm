import { sprintf } from "../../utils/helpers";
import Blueprint from "../Blueprint";
import ColumnDefinition from "../ColumnDefinition";
import Command from "../Command";
import ForeignCommand from "../ForeignCommand";
import Grammar, { SchemaQuery } from "./Grammar";

class MySqlGrammar extends Grammar {
    protected modifiers = [
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

    protected compileAdd(blueprint: Blueprint, command: Command): string {
        const columns = this.prefixArray("add", this.getColumns(blueprint));
        return sprintf(
            "alter table %s %s",
            this.wrapTable(blueprint.getTable()),
            columns.join(", ")
        );
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

        if (command.onDeleteAction) {
            sql += ` on delete ${command.onDeleteAction}`;
        }

        if (command.onUpdateAction) {
            sql += ` on update ${command.onUpdateAction}`;
        }

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

    protected compileDropForeign(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "alter table %s drop foreign key %s",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName)
        );
    }

    protected compileDropColumn(blueprint: Blueprint, command: Command): string {
        const columns = this.prefixArray("drop column", this.wrapArray(command.columns));
        return sprintf(
            "alter table %s %s",
            this.wrapTable(blueprint.getTable()),
            columns.join(", ")
        );
    }

    protected compileDrop(blueprint: Blueprint, command: Command): string {
        return `drop table ${this.wrapTable(blueprint.getTable())}`;
    }

    protected compileDropIfExists(blueprint: Blueprint, command: Command): string {
        return `drop table if exists ${this.wrapTable(blueprint.getTable())}`;
    }

    protected compileRenameColumn(blueprint: Blueprint, command: Command): string {
        if (!command.from || !command.to) {
            throw new Error("renameColumn command requires both 'from' and 'to' parameters.");
        }

        return sprintf(
            "alter table %s rename column %s to %s",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.from),
            this.wrapValue(command.to)
        );
    }

    compileTableExists(table: string): SchemaQuery {
        return {
            sql: "select * from information_schema.tables where table_schema = database() and table_name = ? limit 1",
            bindings: [table]
        };
    }

    compileColumnListing(table: string): SchemaQuery {
        return {
            sql: `show columns from ${this.wrapTable(table)}`,
            bindings: []
        };
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

    protected typeDatetime(column: ColumnDefinition): string {
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

}

export default MySqlGrammar;
