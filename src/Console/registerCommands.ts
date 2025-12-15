import CommandRunner from "./CommandRunner";
import MakeMigrationCommand from "./commands/MakeMigrationCommand";
import MigrateCommand from "./commands/MigrateCommand";
import MigrateRefreshCommand from "./commands/MigrateRefreshCommand";
import MigrateRollbackCommand from "./commands/MigrateRollbackCommand";

export function registerDefaultCommands(runner: CommandRunner): void {
    runner
        .register(new MakeMigrationCommand())
        .register(new MigrateCommand())
        .register(new MigrateRollbackCommand())
        .register(new MigrateRefreshCommand());
}
