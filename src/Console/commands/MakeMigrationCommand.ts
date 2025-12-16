import fs from "fs/promises";
import Command from "../Command";
import MigrationCreator, { MigrationLanguage } from "../../Migration/MigrationCreator";
import { getCliConfig } from "../config";
import { parseCommandArgs } from "../utils/argParser";

class MakeMigrationCommand extends Command {
    signature = "make:migration";
    description = "Create a new migration file";
    private directory!: string;
    private language: MigrationLanguage = "typescript";

    async initialize(): Promise<void> {
        await super.initialize();
        const cliConfig = getCliConfig();
        const migrationsConfig = cliConfig.migrations;
        if (!migrationsConfig) {
            throw new Error("Migrations configuration is missing from the connection options.");
        }

        this.directory = migrationsConfig.directory;
        this.language = cliConfig.language;
    }

    async handle(args: string[]): Promise<void> {
        const { positional, options } = parseCommandArgs(args);
        const name = positional[0];
        if (!name) {
            throw new Error("Migration name is required.");
        }

        const table = typeof options.table === "string" ? options.table : undefined;
        const createOption = options.create ?? false;
        const creator = new MigrationCreator(this.directory, this.language);
        const filePath = await creator.create(name, {
            table,
            create: createOption
        });

        await fs.chmod(filePath, 0o644);
        console.log(`Created migration: ${filePath}`);
    }
}

export default MakeMigrationCommand;
