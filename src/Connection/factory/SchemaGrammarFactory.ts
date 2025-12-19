import SchemaGrammar from "../../schema/grammars/Grammar";
import MySqlGrammar from "../../schema/grammars/MySqlGrammar";
import PostgreSqlGrammar from "../../schema/grammars/PostgreSqlGrammar";
import SQLiteGrammar from "../../schema/grammars/SQLiteGrammar";
import { ConnectionOptions } from "../types";

class SchemaGrammarFactory {
    public static getSchemaGrammar(config: ConnectionOptions): SchemaGrammar {
        switch (config.driver) {
            case "mysql":
                return new MySqlGrammar();
            case "postgresql":
                return new PostgreSqlGrammar();
            case "sqlite":
                return new SQLiteGrammar();
            default:
                throw new Error(`Unsupported driver: ${config.driver}`);
        }
    }
}

export default SchemaGrammarFactory;
