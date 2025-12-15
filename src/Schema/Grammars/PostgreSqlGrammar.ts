import { sprintf } from "../../utils/helpers";
import Blueprint from "../Blueprint";
import ColumnDefinition from "../ColumnDefinition";
import Command from "../Command";
import ForeignCommand from "../ForeignCommand";
import Grammar, { SchemaQuery } from "./Grammar";

class PostgreSqlGrammar extends Grammar {
    protected modifiers = ["Nullable", "Default"];

    protected compileCreate(blueprint: Blueprint, command: Command): string {
        const tableStructures: string[] = this.getColumns(blueprint);

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
        );
    }

    protected compileAdd(blueprint: Blueprint, command: Command): string {
        const columns = this.prefixArray("add column", this.getColumns(blueprint));
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
            "alter table %s add constraint %s unique (%s)",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName),
            this.columnize(command.columns)
        );
    }

    protected compilePrimary(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "alter table %s add constraint %s primary key (%s)",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName),
            this.columnize(command.columns)
        );
    }

    protected compileIndex(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "create index %s on %s (%s)",
            this.wrapValue(command.indexName),
            this.wrapTable(blueprint.getTable()),
            this.columnize(command.columns)
        );
    }

    protected compileDrop(blueprint: Blueprint, command: Command): string {
        return `drop table ${this.wrapTable(blueprint.getTable())}`;
    }

    protected compileDropIfExists(blueprint: Blueprint, command: Command): string {
        return `drop table if exists ${this.wrapTable(blueprint.getTable())}`;
    }

    protected compileDropPrimary(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "alter table %s drop constraint %s",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName)
        );
    }

    protected compileDropUnique(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "alter table %s drop constraint %s",
            this.wrapTable(blueprint.getTable()),
            this.wrapValue(command.indexName)
        );
    }

    protected compileDropIndex(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "drop index %s",
            this.wrapValue(command.indexName)
        );
    }

    protected compileDropForeign(blueprint: Blueprint, command: Command): string {
        return sprintf(
            "alter table %s drop constraint %s",
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
            sql: "select * from information_schema.tables where table_schema = current_schema() and table_name = ? limit 1",
            bindings: [table]
        };
    }

    compileColumnListing(table: string): SchemaQuery {
        return {
            sql: "select column_name as column_name from information_schema.columns where table_name = ? and table_schema = current_schema()",
            bindings: [table]
        };
    }

    /**************************** type methods ****************/
    protected typeUuid(column: ColumnDefinition): string {
        return "uuid";
    }

    protected typeInteger(column: ColumnDefinition): string {
        return column.getAttribute("autoIncrement") ? "serial" : "integer";
    }

    protected typeTinyInteger(column: ColumnDefinition): string {
        return "smallint";
    }

    protected typeBigInteger(column: ColumnDefinition): string {
        return column.getAttribute("autoIncrement") ? "bigserial" : "bigint";
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
        return "text";
    }

    protected typeFloat(column: ColumnDefinition): string {
        return "real";
    }

    protected typeDouble(column: ColumnDefinition): string {
        return "double precision";
    }

    protected typeBoolean(column: ColumnDefinition): string {
        return "boolean";
    }

    protected typeDate(column: ColumnDefinition): string {
        return "date";
    }

    protected typeDateTime(column: ColumnDefinition): string {
        if (column.getAttribute("useCurrent")) {
            column.default("CURRENT_TIMESTAMP");
        }

        return "timestamp";
    }

    protected typeTime(column: ColumnDefinition): string {
        return "time";
    }

    protected typeTimestamp(column: ColumnDefinition): string {
        if (column.getAttribute("useCurrent")) {
            column.default("CURRENT_TIMESTAMP");
        }

        return "timestamp";
    }

    protected typeYear(column: ColumnDefinition): string {
        return "smallint";
    }

    protected typeJson(column: ColumnDefinition): string {
        return "jsonb";
    }

    protected typeBinary(column: ColumnDefinition): string {
        return "bytea";
    }

    /**************************** modifier methods ****************/
    protected modifyNullable(blueprint: Blueprint, column: ColumnDefinition): string {
        return column.getAttribute("nullable") ? " null" : " not null";
    }

    protected modifyDefault(blueprint: Blueprint, column: ColumnDefinition): string {
        if (column.getAttribute("default") !== undefined) {
            return ` default ${column.getAttribute("default")}`;
        }

        return "";
    }

    protected wrapTable(value: string): string {
        return this.wrapValue(value);
    }

    protected wrapValue(value: string): string {
        if (value === "*") {
            return value;
        }

        return '"' + value.replace(/"/g, '""') + '"';
    }
}

export default PostgreSqlGrammar;
