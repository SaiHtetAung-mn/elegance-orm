import Grammar from "../../Query/Grammars/Grammar";
import MySqlGrammar from "../../Query/Grammars/MySqlGrammar";
import PostgreSqlGrammar from "../../Query/Grammars/PostgreSqlGrammar";
import SQLiteGrammar from "../../Query/Grammars/SQLiteGrammar";
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
