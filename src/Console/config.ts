import path from "path";
import { ConnectionOptions } from "../Connection/types";

let cachedConfig: ConnectionOptions | null = null;

function parseNumber(value: string | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }

    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
}

export function getConfig(): ConnectionOptions {
    if (cachedConfig) {
        return cachedConfig;
    }

    const driver = (process.env.DB_CONNECTION as ConnectionOptions["driver"]) ?? "postgresql";
    const defaultPort = driver === "mysql" ? 3306 : driver === "postgresql" ? 5432 : 0;
    const migrationsDirectory = process.env.DB_MIGRATIONS_DIRECTORY
        ?? path.resolve(process.cwd(), "database/migrations");

    const maxPoolSizeValue = process.env.DB_MAX_POOL_SIZE;
    let maxPoolSize: number | undefined;
    if (maxPoolSizeValue) {
        const parsed = parseInt(maxPoolSizeValue, 10);
        if (!Number.isNaN(parsed)) {
            maxPoolSize = parsed;
        }
    }

    cachedConfig = {
        driver,
        host: process.env.DB_HOST ?? "localhost",
        port: parseNumber(process.env.DB_PORT, defaultPort),
        database: process.env.DB_DATABASE ?? "orm_test",
        user: process.env.DB_USERNAME ?? "saihtetaung",
        password: process.env.DB_PASSWORD ?? "",
        maxPoolSize,
        migrations: {
            directory: migrationsDirectory,
            table: process.env.DB_MIGRATIONS_TABLE ?? "migrations"
        }
    };

    return cachedConfig;
}
