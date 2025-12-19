import Blueprint from "../Blueprint";
import ColumnDefinition from "../ColumnDefinition";
import Command from "../Command";
import ForeignCommand from "../ForeignCommand";
import Grammar, { SchemaQuery } from "./Grammar";

class SQLiteGrammar extends Grammar {
    protected modifiers = ["Nullable", "Default", "Increment"];

    protected compileCreate(blueprint: Blueprint, command: Command): string {
        const tableStructures: string[] = this.getColumns(blueprint);

        const primaryCommand = blueprint.getCommands().find(cmd => cmd.name === "primary");
        if (primaryCommand) {
            const pkColumns: string = this.columnize(primaryCommand.columns);
            tableStructures.push(`primary key (${pkColumns})`);
            primaryCommand.shouldBeSkipped = true;
        }

        const foreignCommands = blueprint.getCommands().filter(
            (cmd): cmd is ForeignCommand => cmd.name === "foreign"
        );
        foreignCommands.forEach(foreignCommand => {
            tableStructures.push(this.inlineForeignKey(foreignCommand));
            foreignCommand.shouldBeSkipped = true;
        });

        return `create table ${this.wrapTable(blueprint.getTable())} (${tableStructures.join(", ")})`;
    }

    protected compileAdd(blueprint: Blueprint, command: Command): string {
        const columns = this.getColumns(blueprint);
        return columns
            .map(column => `alter table ${this.wrapTable(blueprint.getTable())} add column ${column}`)
            .join("; ");
    }

    protected compileForeign(blueprint: Blueprint, command: ForeignCommand): string {
        let sql = `alter table ${this.wrapTable(blueprint.getTable())} add constraint ${this.wrapValue(command.indexName)} `;
        sql += this.foreignKeyStatement(command);

        return sql;
    }

    protected compileUnique(blueprint: Blueprint, command: Command): string {
        return `create unique index ${this.wrapValue(command.indexName)} on ${this.wrapTable(blueprint.getTable())} (${this.columnize(command.columns)})`;
    }

    protected compilePrimary(blueprint: Blueprint, command: Command): string {
        return `alter table ${this.wrapTable(blueprint.getTable())} add constraint ${this.wrapValue(command.indexName)} primary key (${this.columnize(command.columns)})`;
    }

    protected compileIndex(blueprint: Blueprint, command: Command): string {
        return `create index ${this.wrapValue(command.indexName)} on ${this.wrapTable(blueprint.getTable())} (${this.columnize(command.columns)})`;
    }

    protected compileDrop(blueprint: Blueprint, command: Command): string {
        return `drop table ${this.wrapTable(blueprint.getTable())}`;
    }

    protected compileDropIfExists(blueprint: Blueprint, command: Command): string {
        return `drop table if exists ${this.wrapTable(blueprint.getTable())}`;
    }

    protected compileDropPrimary(blueprint: Blueprint, command: Command): string {
        return `alter table ${this.wrapTable(blueprint.getTable())} drop constraint ${this.wrapValue(command.indexName)}`;
    }

    protected compileDropUnique(blueprint: Blueprint, command: Command): string {
        return `drop index if exists ${this.wrapValue(command.indexName)}`;
    }

    protected compileDropIndex(blueprint: Blueprint, command: Command): string {
        return `drop index if exists ${this.wrapValue(command.indexName)}`;
    }

    protected compileDropForeign(blueprint: Blueprint, command: Command): string {
        return `alter table ${this.wrapTable(blueprint.getTable())} drop constraint ${this.wrapValue(command.indexName)}`;
    }

    protected compileDropColumn(blueprint: Blueprint, command: Command): string {
        const columns = command.columns ?? [];
        return columns
            .map(column => `alter table ${this.wrapTable(blueprint.getTable())} drop column ${this.wrapValue(column)}`)
            .join("; ");
    }

    private inlineForeignKey(command: ForeignCommand): string {
        return `constraint ${this.wrapValue(command.indexName)} ${this.foreignKeyStatement(command)}`;
    }

    private foreignKeyStatement(command: ForeignCommand): string {
        let sql = `foreign key (${this.columnize(command.columns)}) references ${this.wrapTable(command.referenceTable)} (${this.columnize([command.referenceColumn])})`;

        if (command.onDeleteAction) {
            sql += ` on delete ${command.onDeleteAction}`;
        }

        if (command.onUpdateAction) {
            sql += ` on update ${command.onUpdateAction}`;
        }

        return sql;
    }

    protected compileRenameColumn(blueprint: Blueprint, command: Command): string {
        if (!command.from || !command.to) {
            throw new Error("renameColumn command requires both 'from' and 'to' parameters.");
        }

        return `alter table ${this.wrapTable(blueprint.getTable())} rename column ${this.wrapValue(command.from)} to ${this.wrapValue(command.to)}`;
    }

    compileTableExists(table: string): SchemaQuery {
        return {
            sql: "select * from sqlite_master where type = 'table' and name = ? limit 1",
            bindings: [table]
        };
    }

    compileColumnListing(table: string): SchemaQuery {
        return {
            sql: `pragma table_info(${this.wrapValue(table)})`,
            bindings: []
        };
    }

    /**************************** type methods ****************/
    protected typeUuid(column: ColumnDefinition): string {
        return "varchar(36)";
    }

    protected typeInteger(column: ColumnDefinition): string {
        return "integer";
    }

    protected typeTinyInteger(column: ColumnDefinition): string {
        return "integer";
    }

    protected typeBigInteger(column: ColumnDefinition): string {
        return "integer";
    }

    protected typeSmallInteger(column: ColumnDefinition): string {
        return "integer";
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
        return "float";
    }

    protected typeDouble(column: ColumnDefinition): string {
        return "double";
    }

    protected typeBoolean(column: ColumnDefinition): string {
        return "integer";
    }

    protected typeDate(column: ColumnDefinition): string {
        return "date";
    }

    protected typeDatetime(column: ColumnDefinition): string {
        if (column.getAttribute("useCurrent")) {
            column.default("CURRENT_TIMESTAMP");
        }

        return "datetime";
    }

    protected typeTime(column: ColumnDefinition): string {
        return "time";
    }

    protected typeTimestamp(column: ColumnDefinition): string {
        if (column.getAttribute("useCurrent")) {
            column.default("CURRENT_TIMESTAMP");
        }

        return "datetime";
    }

    protected typeYear(column: ColumnDefinition): string {
        return "integer";
    }

    protected typeJson(column: ColumnDefinition): string {
        return "text";
    }

    protected typeBinary(column: ColumnDefinition): string {
        return "blob";
    }

    /**************************** modifier methods ****************/
    protected modifyNullable(blueprint: Blueprint, column: ColumnDefinition): string {
        return column.getAttribute("nullable") ? "" : " not null";
    }

    protected modifyDefault(blueprint: Blueprint, column: ColumnDefinition): string {
        if (column.getAttribute("default") !== undefined) {
            return ` default ${column.getAttribute("default")}`;
        }

        return "";
    }

    protected modifyIncrement(blueprint: Blueprint, column: ColumnDefinition): string {
        if (column.getAttribute("autoIncrement")) {
            const primaryCommand = blueprint.getCommands().find(cmd => cmd.name === "primary");
            if (primaryCommand) {
                primaryCommand.shouldBeSkipped = true;
            }

            return " primary key autoincrement";
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

export default SQLiteGrammar;
