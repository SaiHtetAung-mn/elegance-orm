import MigrationCommand from "../MigrationCommand";
import { parseCommandArgs } from "../utils/argParser";

class MigrateRefreshCommand extends MigrationCommand {
    signature = "migrate:refresh";
    description = "Reset and re-run all migrations";

    async handle(args: string[]): Promise<void> {
        parseCommandArgs(args);
        const rolledBack = await this.migrator.reset();
        const ran = await this.migrator.run();

        if (rolledBack.length === 0) {
            console.log("Database was already clean.");
        } else {
            rolledBack.forEach(name => console.log(`Rolled back: ${name}`));
        }

        if (ran.length === 0) {
            console.log("No migrations were run.");
        } else {
            ran.forEach(name => console.log(`Migrated: ${name}`));
        }
    }
}

export default MigrateRefreshCommand;
