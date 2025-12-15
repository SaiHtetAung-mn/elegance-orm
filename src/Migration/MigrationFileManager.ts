import fs from "fs/promises";
import path from "path";
import Migration from "../Schema/Migration";
import { MigrationFileMap } from "./types";

class MigrationFileManager {
    constructor(private directory: string) { }

    async getMigrationFiles(): Promise<MigrationFileMap> {
        await this.ensureDirectory();
        const files = await fs.readdir(this.directory);
        const migrations: MigrationFileMap = {};

        files
            .filter(file => file.endsWith(".ts") || file.endsWith(".js"))
            .sort()
            .forEach(file => {
                const name = path.basename(file, path.extname(file));
                migrations[name] = path.join(this.directory, file);
            });

        return migrations;
    }

    async instantiate(filePath: string): Promise<Migration> {
        const absolutePath = path.resolve(filePath);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const imported = require(absolutePath);
        const MigrationClass = imported.default ?? Object.values(imported)[0];

        if (typeof MigrationClass !== "function") {
            throw new Error(`Migration file "${filePath}" does not export a class.`);
        }

        const instance = new MigrationClass();
        if (!(instance instanceof Migration)) {
            throw new Error(`Class exported by "${filePath}" must extend Migration.`);
        }

        return instance;
    }

    private async ensureDirectory(): Promise<void> {
        await fs.mkdir(this.directory, { recursive: true });
    }
}

export default MigrationFileManager;
