import { describe, it } from "mocha";
import { strict as assert } from "assert";
import Model from "../../src/Model/Model";
import MassAssignmentException from "../../src/Exception/MassAssignmentException";

class TestUser extends Model {
    protected table = "users";
    protected fillable = ["name", "email"];

    public markExisting(): void {
        this.isNew = false;
        this.syncOriginalAttributes();
    }

    public dirtyAttributes(): Record<string, any> {
        return this.getDirty();
    }
}

class GuardedModel extends Model {
}

describe("Model", () => {
    it("fills only declared fillable attributes", () => {
        const user = new TestUser();
        user.fill({ name: "Jane", email: "jane@example.com", role: "admin" });

        const output = user.toJSON();
        assert.equal(output.name, "Jane");
        assert.equal(output.email, "jane@example.com");
        assert.equal(Object.prototype.hasOwnProperty.call(output, "role"), false);
    });

    it("tracks dirty attributes once the model exists", () => {
        const user = new TestUser();
        user.fill({ name: "Jane", email: "jane@example.com" });
        user.markExisting();

        user.name = "Janet";

        const dirty = user.dirtyAttributes();
        assert.deepEqual(dirty, { name: "Janet" });
    });

    it("throws when attempting mass assignment on a totally guarded model", () => {
        const guarded = new GuardedModel();
        assert.throws(() => guarded.fill({ name: "Jane" }), MassAssignmentException);
    });
});

