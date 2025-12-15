import Connection from "../../src/Connection/Connection";
import Schema from "../../src/Schema/Schema";
import { ConnectionOptions } from "../../src/Connection/types";

export const integrationConfig: ConnectionOptions = {
    driver: "postgresql",
    host: "localhost",
    port: 5432,
    user: "saihtetaung",
    password: "",
    database: "orm_test"
};

export const cleanIntegrationTables = async () => {
    if (!Connection.isInitialized()) {
        return;
    }

    if (await Schema.hasTable("integration_users")) {
        await Schema.drop("integration_users");
    }

    if (await Schema.hasTable("integration_roles")) {
        await Schema.drop("integration_roles");
    }
};

export const migrateIntegrationSchema = async () => {
    if (!Connection.isInitialized()) {
        throw new Error("Connection must be initialized before migrating schema");
    }

    await cleanIntegrationTables();

    await Schema.create("integration_roles", table => {
        table.id().primary();
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

    await Schema.table("integration_users", table => {
        table.integer("role_id");
        table.foreign("role_id")
            .references("id")
            .on("integration_roles")
            .onDelete("cascade")
            .onUpdate("cascade");
    });

    await Schema.table("integration_users", table => {
        table.renameColumn("username", "handle");
    });

    await Schema.table("integration_users", table => {
        table.dropForeign("integration_users_role_id_foreign");
    });

    await Schema.table("integration_users", table => {
        table.dropColumns(["role_id", "last_login"]);
    });
};
