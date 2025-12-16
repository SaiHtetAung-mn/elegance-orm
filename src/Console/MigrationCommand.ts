import MigrationFileManager from "../Migration/MigrationFileManager";
import Migrator from "../Migration/Migrator";
import MigrationRepository from "../Migration/MigrationRepository";
import DatabaseCommand from "./DatabaseCommand";

abstract class MigrationCommand extends DatabaseCommand {
    protected migrator!: Migrator;

    async initialize(): Promise<void> {
        await super.initialize();
        const migrationsConfig = this.migrationsConfig;
        if (!migrationsConfig) {
            throw new Error("Migrations configuration is missing from the connection options.");
        }

        const repository = new MigrationRepository(migrationsConfig.table ?? "migrations");
        const fileManager = new MigrationFileManager(migrationsConfig.directory);
        this.migrator = new Migrator(repository, fileManager);
    }
}

export default MigrationCommand;
