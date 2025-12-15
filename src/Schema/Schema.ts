import Connection from "../Connection/Connection";
import SchemaBuilder from "./Builders/Builder";
import Blueprint from "./Blueprint";

class Schema {
    private static getBuilder(): SchemaBuilder {
        return new SchemaBuilder(Connection.getInstance());
    }

    static async create(table: string, callback: (table: Blueprint) => void): Promise<void> {
        await this.getBuilder().create(table, callback);
    }

    static async table(table: string, callback: (table: Blueprint) => void): Promise<void> {
        await this.getBuilder().table(table, callback);
    }

    static async drop(table: string): Promise<void> {
        await this.getBuilder().drop(table);
    }

    static async dropIfExists(table: string): Promise<void> {
        await this.getBuilder().dropIfExists(table);
    }

    static async hasTable(table: string): Promise<boolean> {
        return await this.getBuilder().hasTable(table);
    }

    static async hasColumn(table: string, column: string): Promise<boolean> {
        return await this.getBuilder().hasColumn(table, column);
    }

    static async renameColumn(table: string, from: string, to: string): Promise<void> {
        await this.getBuilder().renameColumn(table, from, to);
    }

    static async dropColumns(table: string, columns: string[] | string): Promise<void> {
        await this.getBuilder().dropColumns(table, columns);
    }
}

export default Schema;
