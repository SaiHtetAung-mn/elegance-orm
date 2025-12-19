import fs from "fs/promises";
import path from "path";
import Command from "../Command";
import { getCliConfig } from "../config";
import { parseCommandArgs } from "../utils/argParser";
import { snakeCase, studlyCase } from "../../utils/helpers";
import type { MigrationLanguage } from "../../migration/MigrationCreator";

class MakeModelCommand extends Command {
    signature = "make:model";
    description = "Create a new model class file";

    private modelsDirectory!: string;
    private language: MigrationLanguage = "typescript";

    async initialize(): Promise<void> {
        await super.initialize();
        const cliConfig = getCliConfig();
        if (!cliConfig.models) {
            throw new Error("Models configuration is missing from the CLI config file.");
        }

        this.modelsDirectory = cliConfig.models.directory;
        this.language = cliConfig.language;
    }

    async handle(args: string[]): Promise<void> {
        const { positional } = parseCommandArgs(args);
        const rawName = positional[0];

        if (!rawName) {
            throw new Error("Model name is required.");
        }

        const normalized = rawName.replace(/\\/g, "/");
        const parsedPath = path.parse(normalized);
        const className = studlyCase(parsedPath.name);

        if (!className) {
            throw new Error("Invalid model name.");
        }

        const extension = this.language === "typescript" ? ".ts" : ".js";
        const directory = path.resolve(this.modelsDirectory, parsedPath.dir);
        const fileBase = parsedPath.name.length > 0 ? parsedPath.name : className;
        const fileName = `${fileBase}${extension}`;
        const destination = path.join(directory, fileName);

        await fs.mkdir(directory, { recursive: true });
        await this.ensureFileDoesNotExist(destination);

        const tableName = this.resolveTableName(className);
        const contents = this.buildStub(className, tableName);
        await fs.writeFile(destination, contents, "utf8");

        console.log(`Created model: ${destination}`);
    }

    private async ensureFileDoesNotExist(target: string): Promise<void> {
        try {
            await fs.access(target);
        } catch {
            return;
        }

        throw new Error(`Model file already exists at "${target}".`);
    }

    private resolveTableName(className: string): string {
        const snake = snakeCase(className);
        return snake.length > 0 ? snake : className.toLowerCase();
    }

    private buildStub(className: string, tableName: string): string {
        if (this.language === "javascript") {
            return `const { Model } = require("elegance-orm");

class ${className} extends Model {
    table = "${tableName}";
    fillable = [];
}

module.exports = ${className};
`;
        }

        return `import { Model } from "elegance-orm";

export default class ${className} extends Model {
    protected table = "${tableName}";
    protected fillable: string[] = [];
}
`;
    }
}

export default MakeModelCommand;
