import DataSource from "../Connection/DataSource";
import { MigrationOptions } from "../Connection/types";
import Command from "./Command";
import { getCliConfig } from "./config";

abstract class DatabaseCommand extends Command {
    protected dataSource!: DataSource;
    protected migrationsConfig?: MigrationOptions;

    async initialize(): Promise<void> {
        const cliConfig = getCliConfig();
        this.dataSource = cliConfig.dataSource;
        this.migrationsConfig = cliConfig.migrations;
        await this.dataSource.initialize();
    }

    async teardown(): Promise<void> {
        if (this.dataSource) {
            await this.dataSource.destroy();
        }
    }
}

export default DatabaseCommand;
