import Connection from "../../connection/Connection";
import Blueprint from "../Blueprint";
import SchemaGrammar from "../grammars/Grammar";

class SchemaBuilder {
    private connection: Connection;
    private grammar: SchemaGrammar;

    constructor(connection: Connection) {
        this.connection = connection;
        this.grammar = connection.getSchemaGrammar();
    }

    async create(tableName: string, callback: (table: Blueprint) => void): Promise<void> {
        const blueprint = new Blueprint(this.connection, tableName);
        blueprint.create();
        callback(blueprint);
        await this.build(blueprint);
    }

    async build(blueprint: Blueprint): Promise<void> {
        await blueprint.build();
    }

    async drop(table: string): Promise<void> {
        const blueprint = new Blueprint(this.connection, table);
        blueprint.drop();
        await this.build(blueprint);
    }

    async dropIfExists(table: string): Promise<void> {
        const blueprint = new Blueprint(this.connection, table);
        blueprint.dropIfExists();
        await this.build(blueprint);
    }

    async table(tableName: string, callback: (table: Blueprint) => void): Promise<void> {
        const blueprint = new Blueprint(this.connection, tableName);
        callback(blueprint);
        await this.build(blueprint);
    }

    async hasTable(table: string): Promise<boolean> {
        const compiled = this.grammar.compileTableExists(table);
        const results = await this.connection.select(compiled.sql, compiled.bindings);
        return results.length > 0;
    }

    async hasColumn(table: string, column: string): Promise<boolean> {
        const compiled = this.grammar.compileColumnListing(table);
        const columns = await this.connection.select(compiled.sql, compiled.bindings);
        const normalizedColumns = this.normalizeColumnListing(columns);
        return normalizedColumns.includes(column.toLowerCase());
    }

    async renameColumn(table: string, from: string, to: string): Promise<void> {
        const blueprint = new Blueprint(this.connection, table);
        blueprint.renameColumn(from, to);
        await this.build(blueprint);
    }

    async dropColumns(table: string, columns: string[] | string): Promise<void> {
        const list = Array.isArray(columns) ? columns : [columns];
        const blueprint = new Blueprint(this.connection, table);
        blueprint.dropColumns(list);
        await this.build(blueprint);
    }

    private normalizeColumnListing(rows: any[]): string[] {
        return rows
            .map(row => this.extractColumnName(row))
            .filter((name): name is string => Boolean(name))
            .map(name => name.toLowerCase());
    }

    private extractColumnName(row: any): string | null {
        if (!row || typeof row !== "object") {
            return null;
        }

        const candidates = ["Field", "field", "COLUMN_NAME", "column_name", "name"];
        for (const key of candidates) {
            if (row[key] !== undefined) {
                return String(row[key]);
            }
        }

        const values = Object.values(row);
        if (values.length > 0 && typeof values[0] === "string") {
            return values[0] as string;
        }

        return null;
    }
}

export default SchemaBuilder;
