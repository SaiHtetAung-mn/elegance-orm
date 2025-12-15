import MigrationCommand from "../MigrationCommand";
import { parseCommandArgs } from "../utils/argParser";

class MigrateRollbackCommand extends MigrationCommand {
    signature = "migrate:rollback";
    description = "Rollback the last database migration batch";

    async handle(args: string[]): Promise<void> {
        const { options } = parseCommandArgs(args);
        const steps = options.step ? Number(options.step) : 1;
        const rolledBack = await this.migrator.rollback(Number.isNaN(steps) ? 1 : steps);

        if (rolledBack.length === 0) {
            console.log("Nothing to rollback.");
            return;
        }

        rolledBack.forEach(name => console.log(`Rolled back: ${name}`));
    }
}

export default MigrateRollbackCommand;
