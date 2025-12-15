import DbConnection from "../drivers/DbConnection";
import MySqlConnection from "../drivers/MySqlConnection";
import PostgreSqlConnection from "../drivers/PostgreSqlConnection";
import SqliteConnection from "../drivers/SqliteConnection";
import { ConnectionOptions } from "../types";

class ConnectionFactory {
    public static getConnection(config: ConnectionOptions): DbConnection {
        switch (config.driver) {
            case "mysql": return new MySqlConnection(config);
            case "postgresql": return new PostgreSqlConnection(config);
            case "sqlite": return new SqliteConnection(config);
            default:
                throw new Error(`Unsupported driver: ${config.driver}`);
        }
    }
}

export default ConnectionFactory;
