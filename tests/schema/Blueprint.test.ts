import { describe, it } from "mocha";
import { strict as assert } from "assert";
import Blueprint from "../../src/Schema/Blueprint";
import Connection from "../../src/Connection/Connection";
import MySqlGrammar from "../../src/Schema/Grammars/MySqlGrammar";

const stubConnection = (): Connection => {
    return {
        getSchemaGrammar: () => new MySqlGrammar(),
        rawQuery: async () => undefined
    } as unknown as Connection;
};

describe("Schema Blueprint", () => {
    it("compiles create table statements with columns", () => {
        const blueprint = new Blueprint(stubConnection(), "users");
        blueprint.create();
        blueprint.id();
        blueprint.string("name").nullable();
        const sql = blueprint.toSql();

        assert.deepEqual(sql, [
            "create table `users` (`id` bigint unsigned not null auto_increment primary key, `name` varchar(255) null)"
        ]);
    });

    it("compiles add column statements for existing tables", () => {
        const blueprint = new Blueprint(stubConnection(), "users");
        blueprint.string("nickname");
        const sql = blueprint.toSql();

        assert.deepEqual(sql, [
            "alter table `users` add `nickname` varchar(255) not null"
        ]);
    });

    it("compiles drop column statements", () => {
        const blueprint = new Blueprint(stubConnection(), "users");
        blueprint.dropColumns(["nickname", "bio"]);
        const sql = blueprint.toSql();

        assert.deepEqual(sql, [
            "alter table `users` drop column `nickname`, drop column `bio`"
        ]);
    });

    it("compiles rename column statements", () => {
        const blueprint = new Blueprint(stubConnection(), "users");
        blueprint.renameColumn("nickname", "display_name");
        const sql = blueprint.toSql();

        assert.deepEqual(sql, [
            "alter table `users` rename column `nickname` to `display_name`"
        ]);
    });
});
