import Connection from "../Connection/Connection";
import ColumnDefinition from "./ColumnDefinition";
import Command from "./Command";
import { columnType } from "./constants/ColumnType";
import SchemaGrammar from "./Grammars/Grammar";
import { TColumnAttribute } from "./types/TColumnAttribute";
import { TCommandParameter } from "./types/TCommandParameter";

class Blueprint {
    private connection: Connection;
    private table: string;
    private grammar: SchemaGrammar;

    private columns: Array<ColumnDefinition> = [];
    private commands: Array<Command> = [];

    constructor(connection: Connection, table: string) {
        this.connection = connection;
        this.grammar = connection.getSchemaGrammar();
        this.table = table;
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

    json(column: string): ColumnDefinition {
        return this.addColumn("json", column);
    }

    binary(column: string): ColumnDefinition {
        return this.addColumn("binary", column);
    }

    protected addColumn(
        type: typeof columnType[keyof typeof columnType],
        name: string,
        parameters: TColumnAttribute = {}
    ): ColumnDefinition {
        const column = new ColumnDefinition(name, type, parameters);
        this.columns.push(column);

        return column;
    }

    protected addCommand(
        name: TCommandName,
        parameters: TCommandParameter = {}
    ): Command {
        const command = new Command(name, parameters);
        this.commands.push(command);

        return command;
    }

    // Command 
    create(): void {
        this.addCommand("create");
    }

    index(columns: string[], name: string|null = null): void {
        const index = name ?? this.createIndexName("index", columns);

        this.addCommand("index", { 
            columns,
            index
         })
    }

    private createIndexName(type: string, columns: string[]): string {
        const index = `${this.table}_${columns.join('_')}_${type}`.toLowerCase();

        // Replace '-' and '.' with '_'
        return index.replace(/[-.]/g, '_');
    }

    toSql(): string[] {
        return [];
    }

    async build(): Promise<void> {

    }
}

export default Blueprint;