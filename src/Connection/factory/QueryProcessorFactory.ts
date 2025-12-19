import MySqlProcessor from "../../query/processors/MySqlProcessor";
import PostgreSqlProcessor from "../../query/processors/PostgreSqlProcessor";
import Processor from "../../query/processors/Processor";
import SQLiteProcessor from "../../query/processors/SQLiteProcessor";
import { ConnectionOptions } from "../types";

class QueryProcessorFactory {
    public static getProcessor(config: ConnectionOptions): Processor {
        switch (config.driver) {
            case "mysql": return new MySqlProcessor();
            case "postgresql": return new PostgreSqlProcessor();
            case "sqlite": return new SQLiteProcessor();
            default: throw new Error(`Unsupported driver: ${config.driver}`);
        }
    }
}

export default QueryProcessorFactory;