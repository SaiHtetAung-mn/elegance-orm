import DbConnection from "@connection/drivers/DbConnection";
import MySqlConnection from "@connection/drivers/MySqlConnection";
import PostgreSqlConnection from "@connection/drivers/PostgreSqlConnection";
import SqliteConnection from "@connection/drivers/SqliteConnection";
import { ConnectionOptions } from "@connection/types";

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
