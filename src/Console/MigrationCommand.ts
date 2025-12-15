import MigrationFileManager from "../Migration/MigrationFileManager";
import Migrator from "../Migration/Migrator";
import MigrationRepository from "../Migration/MigrationRepository";
import DatabaseCommand from "./DatabaseCommand";

abstract class MigrationCommand extends DatabaseCommand {
    protected migrator!: Migrator;

    async initialize(): Promise<void> {
        await super.initialize();
        const repository = new MigrationRepository(this.config.migrations.table ?? "migrations");
        const fileManager = new MigrationFileManager(this.config.migrations.directory);
        this.migrator = new Migrator(repository, fileManager);
    }
}

export default MigrationCommand;
