import Connection from "../Connection/Connection";
import ColumnDefinition from "./ColumnDefinition";
import Command from "./Command";
import { methodExists, firstCharUppercase } from "../utils/general";
import { columnType } from "./constants/ColumnType";
import SchemaGrammar from "./Grammars/Grammar";
import { TColumnAttribute } from "./types/TColumnAttribute";
import { TCommandParameter } from "./types/TCommandParameter";
import ForeignCommand from "./ForeignCommand";
class Blueprint {
    private connection: Connection;
    private table: string;
    private grammar: SchemaGrammar;

    private columns: Array<ColumnDefinition> = [];
    private commands: Array<Command|ForeignCommand> = [];

    constructor(connection: Connection, table: string) {
        this.connection = connection;
        this.grammar = connection.getSchemaGrammar();
        this.table = table;
    }

    getTable(): string {
        return this.table;
    }

    getCommands() {
        return this.commands;
    }

    getColumns() {
        return this.columns;
    }

    foreign(column: string): ForeignCommand {
        const indexName = this.createIndexName("foreign", [column]);
        const command = new ForeignCommand({ columns: [column], indexName });
        this.commands.push(command);

        return command;
    }

    id(column: string = "id"): ColumnDefinition {
        return this.bigIncrement(column);
    }

    uuid(column: string): ColumnDefinition {
        return this.addColumn("uuid", column);
    }

    increment(column: string): ColumnDefinition {
        return this.integer(column, true, true);
    }

    bigIncrement(column: string): ColumnDefinition {
        return this.bigInteger(column, true, true);
    }

    smallIncrement(column: string): ColumnDefinition {
        return this.smallInteger(column, true, true);
    }

    char(column: string, length: number = 255): ColumnDefinition {
        return this.addColumn("char", column, { length });
    }

    string(column: string, length: number = 255): ColumnDefinition {
        return this.addColumn("string", column, { length })
    }

    text(column: string): ColumnDefinition {
        return this.addColumn("text", column)
    }

    longText(column: string): ColumnDefinition {
        return this.addColumn("longText", column);
    }

    integer(
        column: string,
        unsigned: boolean = false,
        autoIncrement: boolean = false
    ): ColumnDefinition {
        return this.addColumn("integer", column, { unsigned, autoIncrement });
    }

    bigInteger(
        column: string,
        unsigned: boolean = false,
        autoIncrement: boolean = false
    ): ColumnDefinition {
        return this.addColumn("bigInteger", column, { unsigned, autoIncrement });
    }

    smallInteger(
        column: string,
        unsigned: boolean = false,
        autoIncrement: boolean = false
    ): ColumnDefinition {
        return this.addColumn("smallInteger", column, { unsigned, autoIncrement });
    }

    float(column: string, precision: number = 53): ColumnDefinition {
        return this.addColumn("float", column, { precision });
    }

    double(column: string): ColumnDefinition {
        return this.addColumn("double", column);
    }

    boolean(column: string): ColumnDefinition {
        return this.addColumn("boolean", column);
    }

    date(column: string): ColumnDefinition {
        return this.addColumn("date", column);
    }

    dateTime(column: string): ColumnDefinition {
        return this.addColumn("datetime", column);
    }

    time(column: string): ColumnDefinition {
        return this.addColumn("time", column);
    }

    timestamp(column: string): ColumnDefinition {
        return this.addColumn("timestamp", column);
    }

    timestamps(): void {
        this.timestamp("created_at").nullable();
        this.timestamp("updated_at").nullable();
    }

    year(column: string): ColumnDefinition {
        return this.addColumn("year", column);
    }

    json(column: string): ColumnDefinition {
        return this.addColumn("json", column);
    }

    binary(column: string): ColumnDefinition {
        return this.addColumn("binary", column);
    }

    private addColumn(
        type: typeof columnType[keyof typeof columnType],
        name: string,
        parameters: TColumnAttribute = {}
    ): ColumnDefinition {
        const column = new ColumnDefinition(name, type, parameters);
        this.columns.push(column);

        return column;
    }

    private addCommand(
        name: TCommandName,
        parameters: TCommandParameter = {}
    ): Command {
        const command = new Command(name, parameters);
        this.commands.push(command);

        return command;
    }

    private indexCommand(name: TCommandName, columns: string[], index: string | null = null): Command {
        const indexName = index || this.createIndexName(name, columns);
        return this.addCommand(name, { columns, indexName });
    }

    private dropIndexCommand(name: TCommandName, type: TCommandName, index: string | string[]): Command {
        let columns: string[] = [];
        // Passed index is array of column names
        if (Array.isArray(index)) {
            columns = index;
            index = this.createIndexName(type, index);
        }

        return this.indexCommand(name, columns, index);
    }

    // Command 
    create(): void {
        this.addCommand("create");
    }

    index(columns: string[], name: string | null = null): void {
        this.indexCommand("index", columns);
    }

    primary(columns: string[]) {
        this.indexCommand("primary", columns);
    }

    unique(columns: string[]): void {
        this.indexCommand("unique", columns);
    }

    drop(): void {
        this.addCommand("drop");
    }

    dropColumns(columns: string[]): void {
        this.addCommand("dropColumn", { columns });
    }

    dropIfExists(): void {
        this.addCommand("dropIfExists");
    }

    dropPrimary(index: string | string[]): void {
        this.dropIndexCommand("dropPrimary", "primary", index);
    }

    dropUnique(index: string | string[]): void {
        this.dropIndexCommand("dropUnique", "unique", index);
    }

    dropIndex(index: string | string[]): void {
        this.dropIndexCommand("dropIndex", "index", index);
    }

    dropForeign(index: string): void {
        this.dropIndexCommand("dropForeign", "foreign", index);
    }

    toSql(): string[] {
        this.addImpliedCommands();

        const sqls: string[] = [];

        for (const cmd of this.commands) {
            if (cmd.shouldBeSkipped) {
                continue;
            }

            const method = `compile${firstCharUppercase(cmd.name)}`;
            const sql = methodExists(this.grammar, method)
                ? (this.grammar as any)[method](this, cmd)
                : null;

            sqls.push(sql);
        }

        return sqls;
    }

    protected addImpliedCommands(): void {
        this.addFluentIndexes();

        if (!this.creating()) {

        }
    }

    protected creating(): boolean {
        return this.commands.some(cmd => cmd.name == "create");
    }

    protected addFluentIndexes() {
        for (const column of this.columns) {
            for (const indexName of ["primary", "unique", "index"]) {
                if (indexName === "primary" && column.getAttribute("autoIncrement")) {
                    break;
                }

                if (column.getAttribute(indexName as any) === true) {
                    (this as any)[indexName]([column.getColumn()]);
                    column.setAttribute(indexName as any, undefined);
                    break;
                } else if (column.getAttribute(indexName as any) === false && column.getAttribute("change")) {
                    (this as any)[`drop${firstCharUppercase(indexName)}`](column.getColumn());
                    column.setAttribute(indexName as any, undefined);
                    break;
                }
            }
        }
    }

    async build(): Promise<void> {
        for (const sql of this.toSql()) {
            await this.connection.rawQuery(sql);
        }
    }

    private createIndexName(type: string, columns: string[]): string {
        const index = `${this.table}_${columns.join('_')}_${type}`.toLowerCase();

        // Replace '-' and '.' with '_'
        return index.replace(/[-.]/g, '_');
    }
}

export default Blueprint;