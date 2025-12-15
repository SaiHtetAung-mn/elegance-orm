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

const compileCreateSql = (callback: (table: Blueprint) => void): string => {
    const blueprint = new Blueprint(stubConnection(), "users");
    blueprint.create();
    callback(blueprint);
    return blueprint.toSql()[0];
};

const compileAlterSql = (callback: (table: Blueprint) => void): string[] => {
    const blueprint = new Blueprint(stubConnection(), "users");
    callback(blueprint);
    return blueprint.toSql();
};

describe("Schema Blueprint", () => {
    describe("table creation", () => {
        it("compiles create table statements with columns", () => {
            const sql = compileCreateSql(table => {
                table.id();
                table.string("name").nullable();
            });

            assert.equal(
                sql,
                "create table `users` (`id` bigint unsigned not null auto_increment primary key, `name` varchar(255) null)"
            );
        });

        it("supports uuid columns", () => {
            const sql = compileCreateSql(table => table.uuid("identifier"));
            assert.match(sql, /`identifier` char\(36\) not null/);
        });

        it("supports increment helpers", () => {
            const sql = compileCreateSql(table => table.bigIncrement("sequence"));
            assert.match(sql, /`sequence` bigint unsigned not null auto_increment primary key/);
        });

        it("supports integer variations", () => {
            const sql = compileCreateSql(table => {
                table.integer("count", true);
                table.smallInteger("small");
                table.bigInteger("big");
            });

            assert.match(sql, /`count` int unsigned not null/);
            assert.match(sql, /`small` smallint not null/);
            assert.match(sql, /`big` bigint not null/);
        });

        it("supports string based columns", () => {
            const sql = compileCreateSql(table => {
                table.char("code", 10);
                table.string("title");
                table.text("body");
                table.longText("article");
            });

            assert.match(sql, /`code` char\(10\) not null/);
            assert.match(sql, /`title` varchar\(255\) not null/);
            assert.match(sql, /`body` text not null/);
            assert.match(sql, /`article` longtext not null/);
        });

        it("supports numeric and boolean columns", () => {
            const sql = compileCreateSql(table => {
                table.float("score", 10);
                table.double("ratio");
                table.boolean("is_active").default(0);
            });

            assert.match(sql, /`score` float\(10\) not null/);
            assert.match(sql, /`ratio` double not null/);
            assert.match(sql, /`is_active` tinyint\(1\) not null default 0/);
        });

        it("supports temporal columns", () => {
            const sql = compileCreateSql(table => {
                table.date("birthday");
                table.dateTime("expires_at").useCurrent();
                table.time("meeting_at");
                table.timestamp("updated_at").useCurrent().useCurrentOnUpdate();
                table.timestamps();
            });

            assert.match(sql, /`birthday` date not null/);
            assert.match(sql, /`expires_at` datetime not null default CURRENT_TIMESTAMP/);
            assert.match(sql, /`meeting_at` time not null/);
            assert.match(sql, /`updated_at` timestamp not null default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP/);
            assert.match(sql, /`created_at` timestamp null/);
            assert.match(sql, /`updated_at` timestamp null/);
        });

        it("supports year, json and binary columns", () => {
            const sql = compileCreateSql(table => {
                table.year("graduated_at");
                table.json("preferences");
                table.binary("avatar");
            });

            assert.match(sql, /`graduated_at` year not null/);
            assert.match(sql, /`preferences` json not null/);
            assert.match(sql, /`avatar` blob not null/);
        });
    });

    describe("table alterations and commands", () => {
        it("compiles add column statements for existing tables", () => {
            const sql = compileAlterSql(table => table.string("nickname"));
            assert.deepEqual(sql, [
                "alter table `users` add `nickname` varchar(255) not null"
            ]);
        });

        it("supports column modifiers for alters", () => {
            const sql = compileAlterSql(table => table.string("nickname").nullable().default("'anon'").after("name"));
            assert.deepEqual(sql, [
                "alter table `users` add `nickname` varchar(255) null default 'anon' after `name`"
            ]);
        });

        it("compiles drop column statements", () => {
            const sql = compileAlterSql(table => table.dropColumns(["nickname", "bio"]));
            assert.deepEqual(sql, [
                "alter table `users` drop column `nickname`, drop column `bio`"
            ]);
        });

        it("compiles rename column statements", () => {
            const sql = compileAlterSql(table => table.renameColumn("nickname", "display_name"));
            assert.deepEqual(sql, [
                "alter table `users` rename column `nickname` to `display_name`"
            ]);
        });

        it("compiles index commands", () => {
            const blueprintSql = compileAlterSql(table => table.index(["email"], "users_email_index"));
            assert.deepEqual(blueprintSql, [
                "alter table `users` add index `users_email_index` (`email`)"
            ]);
        });

        it("compiles unique commands", () => {
            const sql = compileAlterSql(table => table.unique(["email"], "users_email_unique"));
            assert.deepEqual(sql, [
                "alter table `users` add unique `users_email_unique` (`email`)"
            ]);
        });

        it("compiles primary commands", () => {
            const sql = compileAlterSql(table => table.primary(["id"], "users_id_primary"));
            assert.deepEqual(sql, [
                "alter table `users` add primary key `users_id_primary` (`id`)"
            ]);
        });

        it("compiles foreign key commands", () => {
            const sql = compileAlterSql(table =>
                table
                    .foreign("role_id")
                    .references("id")
                    .on("roles")
                    .onDelete("cascade")
                    .onUpdate("cascade")
            );
            assert.deepEqual(sql, [
                "alter table `users` add constraint `users_role_id_foreign` foreign key (`role_id`) references `roles` (`id`) on delete cascade on update cascade"
            ]);
        });

        it("compiles drop statements", () => {
            const sql = compileAlterSql(table => table.drop());
            assert.deepEqual(sql, ["drop table `users`"]);
        });

        it("compiles drop if exists statements", () => {
            const sql = compileAlterSql(table => table.dropIfExists());
            assert.deepEqual(sql, ["drop table if exists `users`"]);
        });

        it("compiles drop primary statements", () => {
            const sql = compileAlterSql(table => table.dropPrimary("users_id_primary"));
            assert.deepEqual(sql, ["alter table `users` drop primary key"]);
        });

        it("compiles drop unique statements", () => {
            const sql = compileAlterSql(table => table.dropUnique("users_email_unique"));
            assert.deepEqual(sql, ["alter table `users` drop unique `users_email_unique`"]);
        });

        it("compiles drop index statements", () => {
            const sql = compileAlterSql(table => table.dropIndex("users_email_index"));
            assert.deepEqual(sql, ["alter table `users` drop index `users_email_index`"]);
        });

        it("compiles drop foreign statements", () => {
            const sql = compileAlterSql(table => table.dropForeign("users_role_id_foreign"));
            assert.deepEqual(sql, ["alter table `users` drop foreign key `users_role_id_foreign`"]);
        });
    });
});
