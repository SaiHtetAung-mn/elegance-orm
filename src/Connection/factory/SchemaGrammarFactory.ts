import SchemaGrammar from "../../Schema/Grammars/Grammar";
import MySqlGrammar from "../../Schema/Grammars/MySqlGrammar";
import PostgreSqlGrammar from "../../Schema/Grammars/PostgreSqlGrammar";
import SQLiteGrammar from "../../Schema/Grammars/SQLiteGrammar";
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
