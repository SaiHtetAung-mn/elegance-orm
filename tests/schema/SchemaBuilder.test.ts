import { describe, it } from "mocha";
import { strict as assert } from "assert";
import Connection from "../../src/Connection/Connection";
import SchemaBuilder from "../../src/Schema/Builders/Builder";
import MySqlGrammar from "../../src/Schema/Grammars/MySqlGrammar";

const executedQueries: Array<{ sql: string; bindings: any[] }> = [];

const createConnectionStub = (selectResponses: any[][]): Connection => {
    let callIndex = 0;
    return {
        getSchemaGrammar: () => new MySqlGrammar(),
        select: async (sql: string, bindings: any[]) => {
            executedQueries.push({ sql, bindings });
            return selectResponses[callIndex++] ?? [];
        }
    } as unknown as Connection;
};

describe("Schema Builder metadata helpers", () => {
    beforeEach(() => {
        executedQueries.length = 0;
    });

    it("determines if a table exists using the grammar query", async () => {
        const connection = createConnectionStub([[{ table_name: "users" }]]);
        const builder = new SchemaBuilder(connection);

        const exists = await builder.hasTable("users");

        assert.equal(exists, true);
        assert.ok(executedQueries[0]);
        assert.match(executedQueries[0].sql, /information_schema\.tables/);
        assert.deepEqual(executedQueries[0].bindings, ["users"]);
    });

    it("lists columns and matches target column name", async () => {
        const connection = createConnectionStub([
            [{ Field: "id" }, { Field: "name" }]
        ]);
        const builder = new SchemaBuilder(connection);

        const hasColumn = await builder.hasColumn("users", "Name");

        assert.equal(hasColumn, true);
        assert.match(executedQueries[0].sql, /show columns/);
    });
});
