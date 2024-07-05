import Grammar from "../../Query/Grammar/Grammar";
import MySqlGrammar from "../../Query/Grammar/MySqlGrammar";
import PostgreSqlGrammar from "../../Query/Grammar/PostgreSqlGrammar";
import SQLiteGrammar from "../../Query/Grammar/SQLiteGrammar";
import { Config } from "../types";

class GrammarFactory {
    public static getGrammar(config: Config): Grammar {
        switch(config.driver) {
            case "mysql": return new MySqlGrammar();
            case "postgresql": return new PostgreSqlGrammar();
            case "sqlite": return new SQLiteGrammar();
            default: throw new Error(`Unsupported driver: ${config.driver}`);
        }
    }
}

export default GrammarFactory;