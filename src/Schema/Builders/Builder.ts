import Connection from "../../Connection/Connection";
import Blueprint from "../Blueprint";
import QueryGrammar from "../Grammars/Grammar";
class SchemaBuilder {
    private connection: Connection;
    private grammar: QueryGrammar;

    constructor(connection: Connection) {
        this.connection = connection;
        this.grammar = connection.getQueryGrammar;
    }

    create(tableName: string, callback: (table: Blueprint) => void) {
        
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