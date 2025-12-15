import fs from "fs/promises";
import path from "path";
import { snakeCase, studlyCase } from "../utils/helpers";

type MigrationCreatorOptions = {
    table?: string;
    create?: string | boolean;
};

class MigrationCreator {
    constructor(private directory: string) { }

    async create(name: string, options: MigrationCreatorOptions = {}): Promise<string> {
        await fs.mkdir(this.directory, { recursive: true });

        const fileName = `${this.timestamp()}_${snakeCase(name)}.ts`;
        const filePath = path.join(this.directory, fileName);
        const stub = await this.getStub(options);

        const tableName = this.getTableName(options);
        const replacements: Record<string, string> = {
            "{{ class }}": studlyCase(name),
            "{{ table }}": tableName ?? "table_name"
        };

        const contents = Object.keys(replacements).reduce((acc, key) => {
            return acc.replace(new RegExp(key, "g"), replacements[key]);
        }, stub);

        await fs.writeFile(filePath, contents, "utf8");
        return filePath;
    }

    private async getStub(options: MigrationCreatorOptions): Promise<string> {
        const stubName = options.create ? "create.stub" : "plain.stub";
        const stubPath = path.resolve(__dirname, "stubs", stubName);
        return await fs.readFile(stubPath, "utf8");
    }

    private timestamp(): string {
        const now = new Date();
        return now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    }

    private getTableName(options: MigrationCreatorOptions): string | null {
        if (typeof options.create === "string" && options.create.length > 0) {
            return options.create;
        }

        if (options.create === true && options.table) {
            return options.table;
        }

        return options.table ?? null;
    }
}

export default MigrationCreator;
