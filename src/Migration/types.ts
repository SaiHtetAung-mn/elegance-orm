import { ConnectionOptions } from "../Connection/types";

export type MigrationConfig = {
    directory: string;
    table?: string;
};

export type MiniOrmConfig = {
    connection: ConnectionOptions;
    migrations: MigrationConfig;
};

export type MigrationFileMap = Record<string, string>;
