import { describe, it, before, after } from "mocha";
import { strict as assert } from "assert";
import DataSource from "../../src/Connection/DataSource";
import Schema from "../../src/Schema/Schema";
import { cleanIntegrationTables, integrationConfig } from "./helpers";

let integrationReady = false;
let dataSource: DataSource | null = null;

describe("Schema migrations with real database connection", () => {
    before(async function () {
        try {
            dataSource = new DataSource(integrationConfig);
            await dataSource.initialize();
            integrationReady = true;
            await cleanIntegrationTables();
        } catch (err) {
            this.skip();
        }
    });

    after(async () => {
        if (integrationReady) {
            //await cleanIntegrationTables();
            await dataSource?.destroy();
        }
    });

    it("executes a comprehensive migration flow", async () => {
        await Schema.create("integration_roles", table => {
            table.uuid("id").primary();
            table.string("name").unique();
        });

        await Schema.create("integration_users", table => {
            table.id().primary();
            table.uuid("public_id");
            table.string("username").unique();
            table.integer("age").unsigned();
            table.boolean("is_active").default(true);
            table.json("preferences").nullable();
            table.timestamp("last_login").nullable();
            table.timestamps();
        });

        assert.equal(await Schema.hasTable("integration_users"), true);
        assert.equal(await Schema.hasColumn("integration_users", "preferences"), true);

        await Schema.table("integration_users", table => {
            table.uuid("role_id");
            table.foreign("role_id")
                .references("id")
                .on("integration_roles")
                .onDelete("cascade")
                .onUpdate("cascade");
        });

        assert.equal(await Schema.hasColumn("integration_users", "role_id"), true);

        await Schema.table("integration_users", table => {
            table.renameColumn("username", "handle");
        });

        assert.equal(await Schema.hasColumn("integration_users", "handle"), true);
        assert.equal(await Schema.hasColumn("integration_users", "username"), false);

        await Schema.table("integration_users", table => {
            table.dropForeign("integration_users_role_id_foreign");
        });

        await Schema.table("integration_users", table => {
            table.dropColumns(["role_id", "last_login"]);
        });

        assert.equal(await Schema.hasColumn("integration_users", "role_id"), false);
        assert.equal(await Schema.hasColumn("integration_users", "last_login"), false);
    });
});
