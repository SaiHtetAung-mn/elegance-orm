import { describe, it, beforeEach, afterEach } from "mocha";
import { strict as assert } from "assert";
import Builder from "../../src/Query/Builder";
import Model from "../../src/Model/Model";
import Connection from "../../src/Connection/Connection";
import MySqlGrammar from "../../src/Query/Grammars/MySqlGrammar";
import operatorEnum from "../../src/Query/enums/operator";
import Processor from "../../src/Query/Processors/Processor";

class TestUser extends Model {
    protected table = "users";
    protected fillable = ["name", "email"];
}

describe("Query Builder", () => {
    let lastSelect: { query: string; bindings: any[] } | null = null;
    let previousInstance: Connection | null = null;

    beforeEach(() => {
        lastSelect = null;
        previousInstance = Connection.isInitialized() ? Connection.getInstance() : null;
        const stubProcessor: Processor = {
            async processSelect(query: string, bindings: any[], ModelClass: any) { return []; },
            async processInsertGetId(query: string, values: any[]) { return 1; },
            async processUpdate(query: string, bindings: any[]) { return 1; },
            async processDelete(query: string, bindings: any[]) { return 1; }
        };

        const stubConnection = {
            getQueryGrammar: () => new MySqlGrammar(),
            getQueryProcessor: () => stubProcessor,
            select: async (query: string, bindings: any[]) => {
                lastSelect = { query, bindings };
                return [{ aggregate: 2 }];
            },
            insert: async () => 1,
            update: async () => 1,
            delete: async () => 1,
            rawQuery: async () => undefined
        } as unknown as Connection;

        Connection.setInstance(stubConnection);
    });

    afterEach(() => {
        Connection.setInstance(previousInstance);
    });

    it("builds SQL with where, order and limit", () => {
        const builder = new Builder(new TestUser());
        const sql = builder
            .select("name")
            .where("email", operatorEnum.EQUAL, "foo@example.com")
            .orderBy("id", "desc")
            .limit(5)
            .toSql();

        assert.equal(sql, "select `name` from `users` where `email` = ? order by `id` desc limit 5");
    });

    it("supports grouping by multiple columns", () => {
        const builder = new Builder(new TestUser());
        const sql = builder.groupBy("role", "status").toSql();
        assert.equal(sql, "select * from `users` group by `role`, `status`");
    });

    it("throws when whereIn receives an empty array", () => {
        const builder = new Builder(new TestUser());
        assert.throws(() => builder.whereIn("id", []));
    });

    it("uses latest helper to order descending", () => {
        const builder = new Builder(new TestUser());
        const sql = builder.latest("created_at").toSql();
        assert.equal(sql, "select * from `users` order by `created_at` desc");
    });

    it("performs count queries using the underlying connection", async () => {
        const builder = new Builder(new TestUser());
        builder.where("id", operatorEnum.EQUAL, 10);
        const result = await builder.count();
        assert.equal(result, 2);
        assert.ok(lastSelect);
        assert.equal(lastSelect?.bindings[0], 10);
    });
});
