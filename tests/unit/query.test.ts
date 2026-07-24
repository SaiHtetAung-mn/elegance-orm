import { strict as assert } from "assert";
import { Model } from "@elegance";
import Connection from "@connection/Connection";
import MySqlGrammar from "@query/grammars/MySqlGrammar";
import PostgreSqlGrammar from "@query/grammars/PostgreSqlGrammar";
import { QueryConnectionStub } from "@tests/unit/helpers";

class QueryTestModel extends Model {
    protected table = "users";
    protected fillable = ["name", "role", "age", "visits"];
}

class SoftDeleteQueryTestModel extends QueryTestModel {
    protected softDeletes = true;
}

class CustomSoftDeleteQueryTestModel extends QueryTestModel {
    protected softDeletes = true;
    protected readonly DELETED_AT = "removed_at";
}

describe("Unit - Query Builder", () => {
    let connectionStub: QueryConnectionStub;

    beforeEach(() => {
        connectionStub = new QueryConnectionStub();
        Connection.setInstance(connectionStub as unknown as Connection);
    });

    afterEach(() => {
        Connection.setInstance(null);
    });

    it("builds projection, ordering, and pagination SQL", () => {
        const builder = QueryTestModel.query()
            .select("name")
            .addSelect(["role", "age"])
            .distinct()
            .orderBy("role")
            .orderByDesc("age")
            .limit(5)
            .offset(10);

        assert.equal(
            builder.toSql(),
            'select distinct "name", "role", "age" from "users" order by "role" asc, "age" desc limit 5 offset 10'
        );
    });

    it("applies filtering helpers and validates input", () => {
        const builder = QueryTestModel.query()
            .where("role", "=", "admin")
            .andWhere("visits", null, 5)
            .orWhere("name", null, "Alice")
            .whereIn("role", ["admin", "editor"])
            .whereNotIn("role", ["banned"])
            .whereBetween("age", [18, 30])
            .whereNotBetween("age", [31, 40])
            .whereNull("bio")
            .whereNotNull("deleted_at");

        const types = builder.getQueryObj().wheres.map(where => where.type);
        assert.deepEqual(types, [
            "basic",
            "basic",
            "basic",
            "in",
            "in",
            "between",
            "not_between",
            "null",
            "not_null"
        ]);

        assert.throws(
            () => QueryTestModel.query().whereIn("role", []),
            /requires a non-empty array/
        );
        assert.throws(
            () => QueryTestModel.query().whereBetween("age", [1] as any),
            /requires exactly two values/
        );
    });

    it("groups, filters, and aggregates without using a database", async () => {
        connectionStub.aggregateValue = 7;
        const builder = QueryTestModel.query()
            .select("role")
            .groupBy("role")
            .having("role", "=", "admin")
            .orderBy("role");

        assert.equal(
            builder.toSql(),
            'select "role" from "users" group by "role" having "role" = ? order by "role" asc'
        );

        const count = await builder.count();
        assert.equal(count, 7);
        assert.ok(connectionStub.lastAggregate?.query.includes("count"));

        builder.select("name");
        assert.equal(
            builder.toSql(),
            'select "role", "name" from "users" group by "role" having "role" = ? order by "role" asc'
        );
    });

    it("returns hydrated models via processor", async () => {
        connectionStub.processor.records = [
            { id: 1, name: "Alpha", role: "admin", age: 30, visits: 2 },
            { id: 2, name: "Beta", role: "editor", age: 25, visits: 3 }
        ];

        const results = await QueryTestModel.query().limit(2).get();
        assert.equal(results.length, 2);
        assert.equal(results[0].name, "Alpha");
        assert.equal(connectionStub.processor.lastSelect?.query, 'select * from "users" limit 2');

        connectionStub.processor.records = [{ id: 99, name: "First" }];
        const first = await QueryTestModel.query().orderBy("name").first();
        assert.equal(first?.name, "First");
        assert.equal(
            connectionStub.processor.lastSelect?.query,
            'select * from "users" order by "name" asc limit 1'
        );
    });

    it("supports insert, update, delete, and create helpers", async () => {
        connectionStub.processor.insertId = 42;
        const insertId = await QueryTestModel.query().insertGetId({
            name: "Charlie",
            role: "guest",
            age: 20,
            visits: 1
        });
        assert.equal(insertId, 42);
        assert.ok(connectionStub.processor.lastInsert?.query.startsWith("insert into"));

        connectionStub.processor.updateCount = 3;
        const updated = await QueryTestModel.query()
            .where("id", "=", 5)
            .update({ name: "Updated" });
        assert.equal(updated, 3);
        assert.deepEqual(connectionStub.processor.lastUpdate?.bindings, ["Updated", 5]);

        connectionStub.processor.deleteCount = 2;
        const deleted = await QueryTestModel.query()
            .where("role", "=", "guest")
            .delete();
        assert.equal(deleted, 2);
        assert.deepEqual(connectionStub.processor.lastDelete?.bindings, ["guest"]);

        const created = await QueryTestModel.create({
            name: "Newbie",
            role: "member",
            age: 19,
            visits: 0
        });
        assert.equal(created.id, 42);
        assert.equal(created.name, "Newbie");
    });

    it("performs bulk inserts without triggering mass assignment checks", async () => {
        await QueryTestModel.query().insert([
            { name: "Bulk One", role: "guest" },
            { name: "Bulk Two", role: "member" }
        ]);

        assert.ok(connectionStub.lastRaw);
        assert.equal(
            connectionStub.lastRaw?.query,
            'insert into "users" ("name", "role") values (?, ?), (?, ?)'
        );
        assert.deepEqual(
            connectionStub.lastRaw?.bindings,
            ["Bulk One", "guest", "Bulk Two", "member"]
        );
    });

    it("validates column consistency during bulk insert", async () => {
        await assert.rejects(
            () => QueryTestModel.query().insert([
                { name: "Mismatch", role: "guest" },
                { name: "Missing role" }
            ] as any),
            /Record at position 1/
        );
    });

    it("builds inner and left joins", () => {
        const builder = QueryTestModel.query()
            .select("users.name")
            .join("profiles", "users.id", "=", "profiles.user_id")
            .leftJoin("roles", "users.role_id", "=", "roles.id");

        assert.equal(
            builder.toSql(),
            'select "users"."name" from "users" inner join "profiles" on "users"."id" = "profiles"."user_id" left join "roles" on "users"."role_id" = "roles"."id"'
        );
    });

    it("supports table aliases when building queries", () => {
        const builder = QueryTestModel.query("u")
            .select("u.name")
            .join("profiles", "u.id", "=", "profiles.user_id");

        assert.equal(
            builder.toSql(),
            'select "u"."name" from "users" as "u" inner join "profiles" on "u"."id" = "profiles"."user_id"'
        );
    });

    it("scopes soft-deleting models without leaking through or conditions", () => {
        assert.equal(
            SoftDeleteQueryTestModel.query().toSql(),
            'select * from "users" where "users"."deleted_at" is null'
        );

        assert.equal(
            SoftDeleteQueryTestModel.query()
                .where("role", "=", "admin")
                .orWhere("name", "=", "Alice")
                .toSql(),
            'select * from "users" where ("role" = ? or "name" = ?) and "users"."deleted_at" is null'
        );

        assert.equal(
            SoftDeleteQueryTestModel.query("u").toSql(),
            'select * from "users" as "u" where "u"."deleted_at" is null'
        );
    });

    it("compiles soft-delete scopes for every supported driver", () => {
        connectionStub.grammar = new MySqlGrammar();
        assert.equal(
            SoftDeleteQueryTestModel.query()
                .where("role", "=", "admin")
                .orWhere("name", "=", "Alice")
                .toSql(),
            "select * from `users` where (`role` = ? or `name` = ?) and `users`.`deleted_at` is null"
        );

        connectionStub.grammar = new PostgreSqlGrammar();
        assert.equal(
            SoftDeleteQueryTestModel.query("u").onlyTrashed().toSql(),
            'select * from "users" as "u" where "u"."deleted_at" is not null'
        );
    });

    it("switches between soft-delete query modes", () => {
        assert.equal(
            SoftDeleteQueryTestModel.query().withTrashed().toSql(),
            'select * from "users"'
        );
        assert.equal(
            SoftDeleteQueryTestModel.query().onlyTrashed().toSql(),
            'select * from "users" where "users"."deleted_at" is not null'
        );
        assert.equal(
            SoftDeleteQueryTestModel.query()
                .withTrashed()
                .withoutTrashed()
                .toSql(),
            'select * from "users" where "users"."deleted_at" is null'
        );
        assert.equal(
            CustomSoftDeleteQueryTestModel.query().toSql(),
            'select * from "users" where "users"."removed_at" is null'
        );

        assert.throws(
            () => QueryTestModel.query().withTrashed(),
            /only available on models with soft deletes enabled/
        );
    });

    it("soft deletes, restores, and force deletes through the builder", async () => {
        const deleted = await SoftDeleteQueryTestModel.query()
            .where("id", "=", 5)
            .delete();

        assert.equal(deleted, 1);
        assert.match(
            connectionStub.processor.lastUpdate?.query ?? "",
            /^update "users" set "deleted_at" = \? where \("id" = \?\) and "users"\."deleted_at" is null$/
        );
        assert.equal(connectionStub.processor.lastUpdate?.bindings[1], 5);
        assert.match(connectionStub.processor.lastUpdate?.bindings[0], /^\d{4}-\d{2}-\d{2} /);

        const restored = await SoftDeleteQueryTestModel.query()
            .where("id", "=", 5)
            .restore();

        assert.equal(restored, 1);
        assert.equal(
            connectionStub.processor.lastUpdate?.query,
            'update "users" set "deleted_at" = ? where ("id" = ?) and "users"."deleted_at" is not null'
        );
        assert.deepEqual(connectionStub.processor.lastUpdate?.bindings, [null, 5]);

        const forceDeleted = await SoftDeleteQueryTestModel.query()
            .withTrashed()
            .where("id", "=", 5)
            .forceDelete();

        assert.equal(forceDeleted, 1);
        assert.equal(
            connectionStub.processor.lastDelete?.query,
            'delete from "users" where "id" = ?'
        );
        assert.deepEqual(connectionStub.processor.lastDelete?.bindings, [5]);
    });

    it("keeps model state in sync when deleting and restoring", async () => {
        const model = SoftDeleteQueryTestModel.hydrate([{
            id: 7,
            name: "Soft Delete",
            deleted_at: null,
            updated_at: "2026-01-01 00:00:00"
        }])[0];

        assert.equal(model.trashed(), false);
        assert.equal(await model.delete(), true);
        assert.equal(model.trashed(), true);
        assert.ok(model.deleted_at);

        assert.equal(await model.restore(), true);
        assert.equal(model.trashed(), false);
        assert.equal(model.deleted_at, null);

        assert.equal(await model.forceDelete(), true);
        assert.equal(
            connectionStub.processor.lastDelete?.query,
            'delete from "users" where "id" = ?'
        );

        await model.save();
        assert.ok(connectionStub.processor.lastInsert);

        const partial = SoftDeleteQueryTestModel.hydrate([{ id: 8 }])[0];
        assert.equal(await partial.restore(), true);
        assert.equal(
            connectionStub.processor.lastUpdate?.query,
            'update "users" set "deleted_at" = ?, "updated_at" = ? where ("id" = ?) and "users"."deleted_at" is not null'
        );
    });

    it("rejects soft-delete operations for regular and unsaved models", async () => {
        const regular = QueryTestModel.hydrate([{ id: 1, name: "Regular" }])[0];
        assert.throws(() => regular.trashed(), /only available/);
        await assert.rejects(() => regular.restore(), /only available/);
        await assert.rejects(() => regular.forceDelete(), /only available/);

        const unsaved = new SoftDeleteQueryTestModel();
        await assert.rejects(() => unsaved.delete(), /Cannot delete an unsaved/);
        await assert.rejects(() => unsaved.restore(), /Cannot restore an unsaved/);
    });
});
