import { strict as assert } from "assert";
import fs from "fs/promises";
import path from "path";
import { after, before, describe, it } from "mocha";
import Connection from "../../../src/connection/Connection";
import { DataSourceOptions } from "../../../src";
import Model from "../../../src/model/Model";
import operatorEnum from "../../../src/query/enums/operator";
import Schema from "../../../src/schema/Schema";

class SqliteUser extends Model {
    protected table = "integration_users";
    protected fillable = ["name", "email", "visits", "category_id"];
}

class GuardedSqliteUser extends Model {
    protected table = "integration_users";
    protected fillable: string[] = [];
    protected guarded: string[] = ["*"];
}

class SqliteCategory extends Model {
    protected table = "integration_categories";
    protected fillable = ["name"];
}

class SqliteAuthor extends Model {
    protected table = "integration_fk_authors";
    protected fillable = ["name"];
}

class SqlitePost extends Model {
    protected table = "integration_fk_posts";
    protected fillable = ["title", "author_id"];
}

const dbPath = path.join(process.cwd(), "tmp", "sqlite", "integration.sqlite3");
const sqliteConfig: DataSourceOptions = {
    driver: "sqlite",
    host: "",
    port: 0,
    user: "",
    password: "",
    database: dbPath
};

async function ensureConnection(): Promise<void> {
    await Connection.initialize(sqliteConfig);
    await Connection.getInstance().rawQuery("pragma foreign_keys = on");
}

describe("Integration - SQLite (real database)", () => {
    before(async () => {
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        await fs.rm(dbPath, { force: true });
    });

    after(async () => {
        if (Connection.isInitialized()) {
            await Connection.disconnect();
        }
    });

    it("executes schema helpers end-to-end", async () => {
        await ensureConnection();

        await Schema.create("integration_categories", table => {
            table.id();
            table.string("name");
            table.timestamps();
        });

        await Schema.create("integration_users", table => {
            table.id();
            table.uuid("external_id").nullable();
            table.string("name");
            table.string("email");
            table.integer("visits").default(0);
            table.boolean("active").default(true);
            table.integer("category_id").nullable();
            table.timestamp("deleted_at").nullable();
            table.timestamps();
            table.index(["email"]);
            table.unique(["external_id"]);
        });

        await Schema.table("integration_users", table => {
            table.string("nickname").nullable();
            table.integer("legacy_level").nullable();
            table.index(["nickname"]);
            table.unique(["email"]);
        });

        await Schema.renameColumn("integration_users", "name", "full_name");
        const hasFullName = await Schema.hasColumn("integration_users", "full_name");
        assert.equal(hasFullName, true);

        await Schema.renameColumn("integration_users", "full_name", "name");
        const hasNameAgain = await Schema.hasColumn("integration_users", "name");
        assert.equal(hasNameAgain, true);

        await Schema.table("integration_users", table => {
            table.dropIndex("integration_users_nickname_index");
            table.dropUnique("integration_users_email_unique");
        });

        await Schema.dropColumns("integration_users", ["nickname", "legacy_level"]);
        const hasNickname = await Schema.hasColumn("integration_users", "nickname");
        assert.equal(hasNickname, false);
        const hasLegacyLevel = await Schema.hasColumn("integration_users", "legacy_level");
        assert.equal(hasLegacyLevel, false);

        const connectionInstance = Connection.getInstance();
        const tables = await connectionInstance.select(
            "select name from sqlite_master where type = 'table' and name in ('integration_users', 'integration_categories')",
            []
        );
        assert.equal(tables.length, 2);

        const userColumns = await connectionInstance.select("pragma table_info('integration_users')", []);
        const columnNames = userColumns.map(row => row.name);
        ["email", "deleted_at", "category_id", "external_id"].forEach(column => {
            assert.ok(columnNames.includes(column));
        });
        assert.ok(!columnNames.includes("nickname"));

        const indexes = await connectionInstance.select("pragma index_list('integration_users')", []);
        assert.ok(indexes.some(index => index.name.includes("email")));
        assert.ok(indexes.some(index => index.unique === 1));

        await Schema.create("integration_logs", table => {
            table.id();
            table.string("action");
        });
        await Schema.drop("integration_logs");
        await Schema.dropIfExists("integration_logs");

        const hasUsersTable = await Schema.hasTable("integration_users");
        assert.equal(hasUsersTable, true);
    });

    it("runs query builder and model helpers while persisting data", async () => {
        await ensureConnection();

        await SqliteUser.query().delete();

        const insertedId = await SqliteUser.query().insertGetId({
            name: "Inserted via builder",
            email: "builder@example.com",
            visits: 2
        });
        assert.notEqual(insertedId, null);
        assert.ok((insertedId as number) > 0);

        const activeUser = await SqliteUser.create({
            name: "Active One",
            email: "active@example.com",
            visits: 3
        });
        const archivedUser = await SqliteUser.create({
            name: "Archived User",
            email: "archived@example.com",
            visits: 8
        });

        const generalCategory = await SqliteCategory.create({ name: "General" });
        activeUser.category_id = generalCategory.id;
        await activeUser.save();

        await SqliteUser.query().insert([
            { name: "Bulk One", email: "bulk-one@example.com", visits: 1 },
            { name: "Bulk Two", email: "bulk-two@example.com", visits: 4 }
        ]);

        await assert.rejects(
            () => GuardedSqliteUser.create({
                name: "Guarded",
                email: "guarded@example.com",
                visits: 1,
                is_admin: true
            } as any),
            (error: any) => {
                assert.equal(error?.name, "MassAssignmentException");
                assert.ok(String(error?.message ?? "").includes("fillable"));
                return true;
            }
        );

        const reloadedActive = await SqliteUser.query().find(activeUser.id);
        assert.ok(reloadedActive);
        const originalCreatedAt = reloadedActive!.created_at;
        const originalUpdatedAt = reloadedActive!.updated_at;

        reloadedActive!.name = "Query Target";
        reloadedActive!.visits = 7;
        await new Promise(resolve => setTimeout(resolve, 1100));
        await reloadedActive!.save();
        assert.equal(reloadedActive!.created_at, originalCreatedAt);
        assert.notEqual(reloadedActive!.updated_at, originalUpdatedAt);

        const deletedAtValue = new Date().toISOString().replace("T", " ").substring(0, 19);
        await SqliteUser.query()
            .where("id", operatorEnum.EQUAL, archivedUser.id)
            .update({ deleted_at: deletedAtValue } as any);

        const deletedCount = await SqliteUser.query()
            .where("email", operatorEnum.EQUAL, "builder@example.com")
            .delete();
        assert.equal(deletedCount, 1);

        const complexResults = await SqliteUser.query()
            .select("name")
            .addSelect(["email", "visits"])
            .distinct()
            .where("visits", operatorEnum.GREATER_THAN, 1)
            .andWhere("name", operatorEnum.NOT_EQUAL, "Banned")
            .andWhere("email", operatorEnum.EQUAL, "active@example.com")
            .orWhere("visits", null, 7)
            .whereIn("name", ["Query Target", "Archived User"])
            .whereNotIn("name", ["Removed"])
            .whereBetween("visits", [2, 10])
            .whereNotBetween("visits", [50, 60])
            .whereNull("deleted_at")
            .whereNotNull("created_at")
            .groupBy("name", "email", "visits")
            .having("name", operatorEnum.NOT_EQUAL, "Nobody")
            .orderBy("name")
            .orderByDesc("visits")
            .limit(5)
            .offset(0)
            .get();
        assert.equal(complexResults.length, 1);
        assert.equal(complexResults[0].name, "Query Target");

        const bulkCount = await SqliteUser.query()
            .whereIn("email", [
                "bulk-one@example.com",
                "bulk-two@example.com"
            ])
            .count();
        assert.equal(bulkCount, 2);
        const latestBulkUser = await SqliteUser.query()
            .where("email", operatorEnum.EQUAL, "bulk-two@example.com")
            .first();
        assert.ok(latestBulkUser);

        const joinedUsers = await SqliteUser.query()
            .select("integration_users.name")
            .addSelect("integration_categories.name as category_name")
            .join(
                "integration_categories",
                "integration_users.category_id",
                "=",
                "integration_categories.id"
            )
            .where("integration_categories.name", operatorEnum.EQUAL, "General")
            .get();
        assert.equal(joinedUsers.length, 1);
        assert.equal(joinedUsers[0].name, "Query Target");
        assert.equal((joinedUsers[0] as any).category_name, "General");

        const paged = await SqliteUser.query()
            .orderBy("id")
            .limit(1)
            .offset(1)
            .get();
        assert.equal(paged[0].id, archivedUser.id);

        const latest = await SqliteUser.query().latest().first();
        assert.equal(latest?.id, latestBulkUser!.id);

        const found = await SqliteUser.query().find(reloadedActive!.id);
        assert.equal(found?.name, "Query Target");

        const aggregateBuilder = () => SqliteUser.query()
            .whereIn("email", ["active@example.com", "archived@example.com"]);
        const count = await aggregateBuilder().count();
        const sum = await aggregateBuilder().sum("visits");
        const avg = await aggregateBuilder().avg("visits");
        const min = await aggregateBuilder().min("visits");
        const max = await aggregateBuilder().max("visits");

        assert.equal(count, 2);
        assert.equal(sum, 15);
        assert.equal(avg, 7.5);
        assert.equal(min, 7);
        assert.equal(max, 8);
    });

    it("enforces inline foreign key constraints with cascading deletes", async () => {
        await ensureConnection();

        await Schema.dropIfExists("integration_fk_posts");
        await Schema.dropIfExists("integration_fk_authors");

        await Schema.create("integration_fk_authors", table => {
            table.id().primary();
            table.string("name");
            table.timestamps();
        });

        await Schema.create("integration_fk_posts", table => {
            table.id().primary();
            table.integer("author_id");
            table.string("title");
            table.timestamps();
            table.foreign("author_id")
                .references("id")
                .on("integration_fk_authors")
                .onDelete("cascade")
                .onUpdate("cascade");
        });

        const foreignKeys = await Connection
            .getInstance()
            .select("pragma foreign_key_list('integration_fk_posts')", []);

        assert.equal(foreignKeys.length, 1);
        assert.equal(foreignKeys[0].table, "integration_fk_authors");

        const author = await SqliteAuthor.create({ name: "Cascade Target" });
        await SqlitePost.create({ title: "Post One", author_id: author.id });
        await SqlitePost.create({ title: "Post Two", author_id: author.id });

        const postCountBeforeDelete = await SqlitePost.query().count();
        assert.equal(postCountBeforeDelete, 2);

        await SqliteAuthor.query()
            .where("id", operatorEnum.EQUAL, author.id)
            .delete();

        const postCountAfterDelete = await SqlitePost.query().count();
        assert.equal(postCountAfterDelete, 0, "Cascade delete should remove dependent rows");

        await Schema.drop("integration_fk_posts");
        await Schema.drop("integration_fk_authors");
    });

    it("retains data between different tests without teardown", async () => {
        if (Connection.isInitialized()) {
            await Connection.disconnect();
        }
        await ensureConnection();

        const persistedUsers = await SqliteUser.query().orderBy("id").get();
        assert.ok(persistedUsers.length >= 2, "Expected data created in earlier tests to remain");
        const names = persistedUsers.map(user => user.name);
        assert.ok(names.includes("Query Target"));
        assert.ok(names.includes("Archived User"));
    });
});
