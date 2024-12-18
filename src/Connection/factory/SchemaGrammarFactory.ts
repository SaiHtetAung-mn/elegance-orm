import SchemaGrammar from "../../Schema/Grammars/Grammar";
import MySqlGrammar from "../../Schema/Grammars/MySqlGrammar";
import { Config } from "../types";

class SchemaGrammarFactory {
    public static getSchemaGrammar(config: Config): SchemaGrammar {
        switch (config.driver) {
            case "mysql": return new MySqlGrammar();
            default: throw new Error(`Unsupported driver: ${config.driver}`);
        }
    }
}

export default SchemaGrammarFactory;