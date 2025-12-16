import fs from "fs/promises";
import path from "path";
import Command from "../Command";

class InitCommand extends Command {
    signature = "init";
    description = "Create an elegance.config.ts file and data source stub in the current project";

    async handle(): Promise<void> {
        const projectRoot = process.cwd();
        const configPath = path.resolve(projectRoot, "elegance.config.ts");
        const createdConfig = await this.ensureConfigFile(configPath);

        if (!createdConfig) {
            console.log("Elegance configuration already exists. No changes made.");
            return;
        }

        console.log(`Created elegance config at ${path.relative(projectRoot, configPath)}`);
        console.log("Elegance initialization complete.");
    }

    private async ensureConfigFile(configPath: string): Promise<boolean> {
        if (await this.fileExists(configPath)) {
            return false;
        }

        const directory = path.dirname(configPath);
        await fs.mkdir(directory, { recursive: true });

        const configContents = `const config = {
    dataSource: "",
    migrations: {
        directory: "",
        table: "migrations"
    },
    language: "typescript"
};

export default config;
`;

        await fs.writeFile(configPath, configContents, "utf-8");
        return true;
    }

    private async fileExists(target: string): Promise<boolean> {
        try {
            await fs.access(target);
            return true;
        } catch {
            return false;
        }
    }
}

export default InitCommand;
