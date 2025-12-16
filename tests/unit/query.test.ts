import { strict as assert } from "assert";
import { Model } from "../../src";
import Connection from "../../src/Connection/Connection";
import { QueryConnectionStub } from "./helpers";

class QueryTestModel extends Model {
    protected table = "users";
    protected fillable = ["name", "role", "age", "visits"];
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
});
