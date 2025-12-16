import { describe, it, beforeEach, afterEach } from "mocha";
import { strict as assert } from "assert";
import fs from "fs/promises";
import path from "path";
import DataSource from "../../src/Connection/DataSource";
import { ConnectionOptions } from "../../src/Connection/types";
import Migrator from "../../src/Migration/Migrator";
import MigrationRepository from "../../src/Migration/MigrationRepository";
import MigrationFileManager from "../../src/Migration/MigrationFileManager";
import Schema from "../../src/Schema/Schema";

const sqliteConfig: ConnectionOptions = {
    driver: "postgresql",
    database: "orm_test",
    host: "localhost",
    password: "",
    port: 5432,
    user: "saihtetaung"
};

describe("Migrator", () => {
    let migrationsDir: string;
    let dataSource: DataSource;

    beforeEach(async () => {
        const baseTmp = path.join(process.cwd(), "tmp");
        await fs.mkdir(baseTmp, { recursive: true });
        migrationsDir = await fs.mkdtemp(path.join(baseTmp, "migrator-"));
        await fs.mkdir(migrationsDir, { recursive: true });
        const content = `
            import Migration from "../../src/Schema/Migration";

            export default class CreateSqliteUsers extends Migration {
                async up() {
                    await this.schema.create("orm_users", table => {
                        table.id();
                        table.string("name");
                    });
                }

                async down() {
                    await this.schema.dropIfExists("orm_users");
                }
            }
        `;
        await fs.writeFile(path.join(migrationsDir, "20240101000000_create_sqlite_users.ts"), content);
        dataSource = new DataSource(sqliteConfig);
        await dataSource.initialize();
    });

    afterEach(async () => {
        await dataSource?.destroy();
        await fs.rm(migrationsDir, { recursive: true, force: true });
    });

    it("runs and rolls back migrations", async () => {
        const repo = new MigrationRepository("migrations");
        const files = new MigrationFileManager(migrationsDir);
        const migrator = new Migrator(repo, files);

        const ran = await migrator.run();
        assert.deepEqual(ran, ["20240101000000_create_sqlite_users"]);
        assert.equal(await Schema.hasTable("orm_users"), true);

        const rolledBack = await migrator.rollback();
        assert.deepEqual(rolledBack, ["20240101000000_create_sqlite_users"]);
        assert.equal(await Schema.hasTable("orm_users"), false);
    });
});
