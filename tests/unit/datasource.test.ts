import { strict as assert } from "assert";
import fs from "fs/promises";
import path from "path";
import { afterEach, beforeEach, describe, it } from "mocha";
import { DataSource, DataSourceOptions } from "../../src";
import Model from "../../src/model/Model";

class TransactionTestUser extends Model {
    protected table = "ds_transactions";
    protected fillable = ["name"];
}

describe("DataSource transactions", () => {
    const dbPath = path.join(process.cwd(), "tmp", "sqlite", "datasource.sqlite3");
    const sqliteConfig: DataSourceOptions = {
        driver: "sqlite",
        host: "",
        port: 0,
        user: "",
        password: "",
        database: dbPath
    };

    let dataSource: DataSource;

    beforeEach(async () => {
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        await fs.rm(dbPath, { force: true });

        dataSource = new DataSource(sqliteConfig);
        await dataSource.initialize();
        await dataSource.rawQuery(`
            create table if not exists ds_transactions (
                id integer primary key autoincrement,
                name text not null,
                created_at text,
                updated_at text
            )
        `);
    });

    afterEach(async () => {
        if (dataSource) {
            await dataSource.rawQuery("drop table if exists ds_transactions");
            await dataSource.destroy();
        }
    });

    it("commits successful transactions", async () => {
        await dataSource.transaction(async trx => {
            await trx.insert("insert into ds_transactions (name) values (?)", ["Committed"]);
        });

        const rows = await dataSource.select("select * from ds_transactions");
        assert.equal(rows.length, 1);
        assert.equal(rows[0].name, "Committed");
    });

    it("rolls back when the callback throws", async () => {
        await assert.rejects(async () => {
            await dataSource.transaction(async trx => {
                await trx.insert("insert into ds_transactions (name) values (?)", ["Should Rollback"]);
                throw new Error("fail");
            });
        });

        const rows = await dataSource.select("select * from ds_transactions");
        assert.equal(rows.length, 0);
    });

    it("allows model helpers inside transactions", async () => {
        await dataSource.transaction(async () => {
            await TransactionTestUser.create({ name: "Model Committed" });
        });

        const users = await TransactionTestUser.query().orderBy("id").get();
        assert.equal(users.length, 1);
        assert.equal(users[0].name, "Model Committed");
        assert.ok(users[0].created_at);
        assert.ok(users[0].updated_at);
    });

    it("rolls back model operations when an error occurs", async () => {
        await assert.rejects(async () => {
            await dataSource.transaction(async () => {
                await TransactionTestUser.create({ name: "Never Persist" });
                throw new Error("abort");
            });
        });

        const count = await TransactionTestUser.query().count();
        assert.equal(count, 0);
    });
});
