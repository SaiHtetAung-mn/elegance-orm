import { describe, it, before, after, beforeEach } from "mocha";
import { strict as assert } from "assert";
import DataSource from "../../src/Connection/DataSource";
import Model from "../../src/Model/Model";
import operatorEnum from "../../src/Query/enums/operator";
import { integrationConfig, migrateIntegrationSchema } from "./helpers";

class IntegrationUser extends Model {
    public id!: number;
    public public_id!: string;
    public handle!: string;
    public age!: number;
    public is_active!: boolean;
    public preferences!: Record<string, any> | null;

    protected table = "integration_users";
    protected fillable = ["public_id", "handle", "age", "is_active", "preferences"];
}

describe("Query builder integration on migrated schema", () => {
    let integrationReady = false;
    let dataSource: DataSource | null = null;

    before(async function () {
        try {
            dataSource = new DataSource(integrationConfig);
            await dataSource.initialize();
            integrationReady = true;
        } catch {
            this.skip();
        }
    });

    beforeEach(async function () {
        if (!integrationReady) {
            this.skip();
        }

        await migrateIntegrationSchema();
    });

    after(async () => {
        if (integrationReady) {
            await dataSource?.destroy();
        }
    });

    it("performs CRUD queries using the real database", async () => {
        const alpha = await IntegrationUser.query().create({
            public_id: "11111111-1111-1111-1111-111111111111",
            handle: "alpha",
            age: 28,
            is_active: true,
            preferences: { theme: "dark" }
        });

        const beta = await IntegrationUser.query().create({
            public_id: "22222222-2222-2222-2222-222222222222",
            handle: "beta",
            age: 32,
            is_active: true,
            preferences: { theme: "light" }
        });

        assert.ok(alpha.id > 0);
        assert.ok(beta.id > 0);

        const fetchedAlpha = await IntegrationUser.query().find(alpha.id);
        assert.equal(fetchedAlpha?.handle, "alpha");
        assert.equal(fetchedAlpha?.is_active, true);

        const activeUsers = await IntegrationUser.query()
            .where("is_active", operatorEnum.EQUAL, true)
            .orderBy("age", "asc")
            .get();
        assert.equal(activeUsers.length, 2);
        assert.equal(activeUsers[0].handle, "alpha");

        const updatedRows = await IntegrationUser.query()
            .where("id", operatorEnum.EQUAL, beta.id)
            .update({
                handle: "bravo",
                age: 40,
                is_active: false
            } as Partial<IntegrationUser>);
        assert.equal(updatedRows, 1);

        const refreshedBeta = await IntegrationUser.query().find(beta.id);
        assert.equal(refreshedBeta?.handle, "bravo");
        assert.equal(refreshedBeta?.age, 40);
        assert.equal(refreshedBeta?.is_active, false);

        const deletedRows = await IntegrationUser.query()
            .where("id", operatorEnum.EQUAL, alpha.id)
            .delete();
        assert.equal(deletedRows, 1);

        const activeCount = await IntegrationUser.query()
            .where("is_active", operatorEnum.EQUAL, true)
            .count();
        assert.equal(activeCount, 0);

        const remaining = await IntegrationUser.query().count();
        assert.equal(remaining, 1);
    });
});
