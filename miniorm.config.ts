import path from "path";
import { ConnectionOptions } from "./src/Connection/types";

const connection: ConnectionOptions = {
    driver: (process.env.DB_CONNECTION as ConnectionOptions["driver"]) || "postgresql",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    database: process.env.DB_DATABASE || "orm_test",
    user: process.env.DB_USERNAME || "saihtetaung",
    password: process.env.DB_PASSWORD || ""
};

const config = {
    connection,
    migrations: {
        directory: path.resolve(__dirname, "database/migrations"),
        table: "migrations"
    }
};

export default config;
