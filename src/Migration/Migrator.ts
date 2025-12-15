import Migration from "../Schema/Migration";
import MigrationFileManager from "./MigrationFileManager";
import MigrationRepository from "./MigrationRepository";

class Migrator {
    constructor(
        private repository: MigrationRepository,
        private fileManager: MigrationFileManager
    ) { }

    async run(): Promise<string[]> {
        await this.repository.ensureTable();
        const files = await this.fileManager.getMigrationFiles();
        const ran = await this.repository.getRan();
        const pending = Object.keys(files)
            .filter(name => !ran.includes(name))
            .map(name => ({ name, file: files[name] }));

        if (pending.length === 0) {
            return [];
        }

        const batch = await this.repository.getNextBatchNumber();
        for (const migration of pending) {
            await this.runMigration(migration.file, "up");
            await this.repository.log(migration.name, batch);
        }

        return pending.map(migration => migration.name);
    }

    async rollback(steps: number = 1): Promise<string[]> {
        await this.repository.ensureTable();
        const records = await this.repository.getMigrationsDescending();
        if (records.length === 0) {
            return [];
        }

        const batchNumbers = Array.from(
            new Set(records.map(record => record.batch))
        ).slice(0, Math.max(steps, 1));

        const files = await this.fileManager.getMigrationFiles();
        const toRollback = records.filter(record => batchNumbers.includes(record.batch));
        const rolledBack: string[] = [];

        for (const record of toRollback) {
            const file = files[record.migration];
            if (!file) {
                throw new Error(`Migration file for "${record.migration}" not found.`);
            }

            await this.runMigration(file, "down");
            await this.repository.delete(record.migration);
            rolledBack.push(record.migration);
        }

        return rolledBack;
    }

    async reset(): Promise<string[]> {
        await this.repository.ensureTable();
        const records = await this.repository.getMigrationsDescending();
        const files = await this.fileManager.getMigrationFiles();
        const resetMigrations: string[] = [];

        for (const record of records) {
            const file = files[record.migration];
            if (!file) {
                throw new Error(`Migration file for "${record.migration}" not found.`);
            }

            await this.runMigration(file, "down");
            await this.repository.delete(record.migration);
            resetMigrations.push(record.migration);
        }

        return resetMigrations;
    }

    private async runMigration(filePath: string, method: "up" | "down"): Promise<void> {
        const instance = await this.fileManager.instantiate(filePath);
        const migrationMethod = (instance[method] as (() => Promise<void>) | undefined)?.bind(instance);

        if (!migrationMethod) {
            throw new Error(`Migration at "${filePath}" does not implement ${method}().`);
        }

        await migrationMethod();
    }
}

export default Migrator;
