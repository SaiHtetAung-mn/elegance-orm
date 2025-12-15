import { describe, it, afterEach } from "mocha";
import { strict as assert } from "assert";
import fs from "fs/promises";
import path from "path";
import MigrationCreator from "../../src/Migration/MigrationCreator";

describe("MigrationCreator", () => {
    let tempDir: string;

    afterEach(async () => {
        if (tempDir) {
            await fs.rm(tempDir, { recursive: true, force: true });
        }
    });

    it("generates migration files using stubs", async () => {
        const baseTmp = path.join(process.cwd(), "tmp");
        await fs.mkdir(baseTmp, { recursive: true });
        tempDir = await fs.mkdtemp(path.join(baseTmp, "migrations-"));
        const creator = new MigrationCreator(tempDir);

        const filePath = await creator.create("create_users_table", { create: "users" });
        const contents = await fs.readFile(filePath, "utf8");

        assert.ok(contents.includes("class CreateUsersTable"));
        assert.ok(contents.includes(`this.schema.create("users"`));
    });
});
