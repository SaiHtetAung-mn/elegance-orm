import Connection from "../../Connection/Connection";
import Blueprint from "../Blueprint";
import SchemaGrammar from "../Grammars/Grammar";
class SchemaBuilder {
    private connection: Connection;
    private grammar: SchemaGrammar;

    constructor(connection: Connection) {
        this.connection = connection;
        this.grammar = connection.getSchemaGrammar();
    }

    create(tableName: string, callback: (table: Blueprint) => void) {
        const blueprint = new Blueprint(this.connection, tableName);
        callback(blueprint);
        this.build(blueprint);
    }

    async build(blueprint: Blueprint): Promise<void> {
        await blueprint.build();
    }

    drop(table: string) {
        
    }

    dropIfExists(table: string) {

    }

    table(table: string, callback: (table: Blueprint) => void) {
        
    }

    hasTable(table: string) {

    }

    hasColumn(column: string, table: string) {

    }

    renameColumn(column: string, table: string) {

    }

    dropColumn(column: string, table: string) {
        
    }

    dropColumns(columns: string[], table: string) {

    }
}

export default SchemaBuilder;