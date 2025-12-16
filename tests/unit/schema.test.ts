import { strict as assert } from "assert";
import SchemaBuilder from "../../src/Schema/Builders/Builder";
import { SchemaConnectionStub } from "./helpers";
import Connection from "../../src/Connection/Connection";

describe("Unit - Schema Builder", () => {
    let connection: SchemaConnectionStub;
    let builder: SchemaBuilder;

    beforeEach(() => {
        connection = new SchemaConnectionStub();
        builder = new SchemaBuilder(connection as unknown as Connection);
    });

    it("creates tables with multiple column types", async () => {
        await builder.create("widgets", table => {
            table.id();
            table.uuid("external_id");
            table.string("name");
            table.text("description").nullable();
            table.integer("quantity").default(0);
            table.boolean("published").default(1);
            table.json("meta").nullable();
            table.timestamps();
        });

        assert.equal(connection.statements.length, 1);
        const sql = connection.statements[0];
        assert.ok(sql.includes('create table "widgets"'));
        assert.ok(sql.includes('"external_id" varchar(36)'));
        assert.ok(sql.includes('"name" varchar(255)'));
        assert.ok(sql.includes('"description" text'));
        assert.ok(sql.includes('"quantity" integer not null default 0'));
        assert.ok(sql.includes('"published" integer not null default 1'));
        assert.ok(sql.includes('"meta" text'));
        assert.ok(sql.includes('"created_at" datetime'));
        assert.ok(sql.includes('"updated_at" datetime'));
    });

    it("adds columns, indexes, and foreign keys", async () => {
        await builder.table("widgets", table => {
            table.string("nickname").nullable();
            table.integer("category_id").unsigned();
            table.index(["nickname"]);
            table.unique(["nickname"]);
            table.foreign("category_id")
                .references("id")
                .on("categories")
                .onDelete("cascade")
                .onUpdate("cascade");
        });

        const sql = connection.statements.join(";");
        assert.ok(sql.includes('alter table "widgets" add column "nickname" varchar(255)'));
        assert.ok(sql.includes('add column "category_id" integer'));
        assert.ok(sql.includes('create index "widgets_nickname_index" on "widgets" ("nickname")'));
        assert.ok(sql.includes('constraint "widgets_category_id_foreign"'));
    });

    it("renames, drops columns, and handles table existence checks", async () => {
        await builder.renameColumn("widgets", "name", "title");
        await builder.dropColumns("widgets", ["legacy_field"]);
        await builder.drop("widgets");
        await builder.dropIfExists("widgets_backup");

        assert.ok(connection.statements.some(sql => sql.includes('rename column "name" to "title"')));
        assert.ok(connection.statements.some(sql => sql.includes('drop column "legacy_field"')));
        assert.ok(connection.statements.some(sql => sql.includes('drop table "widgets"')));
        assert.ok(connection.statements.some(sql => sql.includes('drop table if exists "widgets_backup"')));

        connection.selectResults.push([{}]);
        const hasTable = await builder.hasTable("widgets");
        assert.equal(hasTable, true);
        assert.ok(connection.lastSelect?.sql.includes("sqlite_master"));

        connection.selectResults.push([{ name: "id" }, { name: "title" }]);
        const hasColumn = await builder.hasColumn("widgets", "title");
        assert.equal(hasColumn, true);
    });
});
