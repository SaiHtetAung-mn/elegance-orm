import CommandRunner from "./CommandRunner";
import InitCommand from "./commands/InitCommand";
import MakeMigrationCommand from "./commands/MakeMigrationCommand";
import MakeModelCommand from "./commands/MakeModelCommand";
import MigrateCommand from "./commands/MigrateCommand";
import MigrateRefreshCommand from "./commands/MigrateRefreshCommand";
import MigrateRollbackCommand from "./commands/MigrateRollbackCommand";

export function registerDefaultCommands(runner: CommandRunner): void {
    runner
        .register(new InitCommand())
        .register(new MakeMigrationCommand())
        .register(new MakeModelCommand())
        .register(new MigrateCommand())
        .register(new MigrateRollbackCommand())
        .register(new MigrateRefreshCommand());
}
