import CommandRunner from "@console/CommandRunner";
import InitCommand from "@console/commands/InitCommand";
import MakeMigrationCommand from "@console/commands/MakeMigrationCommand";
import MakeModelCommand from "@console/commands/MakeModelCommand";
import MigrateCommand from "@console/commands/MigrateCommand";
import MigrateRefreshCommand from "@console/commands/MigrateRefreshCommand";
import MigrateRollbackCommand from "@console/commands/MigrateRollbackCommand";

export function registerDefaultCommands(runner: CommandRunner): void {
    runner
        .register(new InitCommand())
        .register(new MakeMigrationCommand())
        .register(new MakeModelCommand())
        .register(new MigrateCommand())
        .register(new MigrateRollbackCommand())
        .register(new MigrateRefreshCommand());
}
