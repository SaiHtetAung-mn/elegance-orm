import MigrationCommand from "../MigrationCommand";
import { parseCommandArgs } from "../utils/argParser";

class MigrateCommand extends MigrationCommand {
    signature = "migrate";
    description = "Run the database migrations";

    async handle(args: string[]): Promise<void> {
        parseCommandArgs(args); // placeholder for future options
        const ran = await this.migrator.run();

        if (ran.length === 0) {
            console.log("Nothing to migrate.");
            return;
        }

        ran.forEach(name => console.log(`Migrated: ${name}`));
    }
}

export default MigrateCommand;
