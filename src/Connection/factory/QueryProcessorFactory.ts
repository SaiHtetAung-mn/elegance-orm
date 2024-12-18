import MySqlProcessor from "../../Query/Processors/MySqlProcessor";
import PostgreSqlProcessor from "../../Query/Processors/PostgreSqlProcessor";
import Processor from "../../Query/Processors/Processor";
import SQLiteProcessor from "../../Query/Processors/SQLiteProcessor";
import { Config } from "../types";

class QueryProcessorFactory {
    public static getProcessor(config: Config): Processor {
        switch (config.driver) {
            case "mysql": return new MySqlProcessor();
            case "postgresql": return new PostgreSqlProcessor();
            case "sqlite": return new SQLiteProcessor();
            default: throw new Error(`Unsupported driver: ${config.driver}`);
        }
    }
}

export default QueryProcessorFactory;