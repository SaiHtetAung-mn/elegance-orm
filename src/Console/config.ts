import path from "path";
import miniOrmConfig from "../../miniorm.config";
import { MiniOrmConfig } from "../Migration/types";

let cachedConfig: MiniOrmConfig | null = null;

export function getConfig(): MiniOrmConfig {
    if (cachedConfig) {
        return cachedConfig;
    }

    const base = miniOrmConfig as Partial<MiniOrmConfig>;
    if (!base.connection) {
        throw new Error("miniorm.config.ts must export a connection configuration.");
    }

    const migrationsDirectory = base.migrations?.directory
        ?? path.resolve(process.cwd(), "database/migrations");

    cachedConfig = {
        connection: base.connection,
        migrations: {
            directory: migrationsDirectory,
            table: base.migrations?.table ?? "migrations"
        }
    };

    return cachedConfig;
}
