import Grammar from "../../query/grammars/Grammar";
import MySqlGrammar from "../../query/grammars/MySqlGrammar";
import PostgreSqlGrammar from "../../query/grammars/PostgreSqlGrammar";
import SQLiteGrammar from "../../query/grammars/SQLiteGrammar";
import { ConnectionOptions } from "../types";

class GrammarFactory {
    public static getQueryGrammar(config: ConnectionOptions): Grammar {
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

export default GrammarFactory;
