import { strict as assert } from "assert";
import CommandRunner from "../../src/Console/CommandRunner";
import { FakeCommand } from "./helpers";
import { registerDefaultCommands } from "../../src/Console/registerCommands";

describe("Unit - CLI and Commands", () => {
    it("registers and lists commands", () => {
        const runner = new CommandRunner();
        const foo = new FakeCommand("foo", "Foo command");
        const bar = new FakeCommand("bar", "Bar command");

        runner.register(foo).register(bar);

        assert.deepEqual(runner.getRegisteredCommands(), [
            { name: "foo", description: "Foo command" },
            { name: "bar", description: "Bar command" }
        ]);

        assert.throws(() => runner.register(new FakeCommand("foo")), /already registered/);
    });

    it("runs commands with lifecycle hooks", async () => {
        const runner = new CommandRunner();
        const cmd = new FakeCommand("demo");
        runner.register(cmd);

        await runner.run(["node", "cli", "demo", "--flag"]);

        assert.equal(cmd.initializeCalls, 1);
        assert.equal(cmd.teardownCalls, 1);
        assert.deepEqual(cmd.handledArgs, ["--flag"]);
    });

    it("tears down even when a command throws", async () => {
        const runner = new CommandRunner();
        const failing = new FakeCommand("boom", "Fail command", true);
        runner.register(failing);

        await assert.rejects(
            () => runner.run(["node", "cli", "boom"]),
            /handle error/
        );
        assert.equal(failing.teardownCalls, 1);
    });

    it("validates provided commands before executing", async () => {
        const runner = new CommandRunner();
        runner.register(new FakeCommand("sample"));

        await assert.rejects(
            () => runner.run(["node", "cli"]),
            /No command provided/
        );

        await assert.rejects(
            () => runner.run(["node", "cli", "unknown"]),
            /Unknown command/
        );
    });

    it("registers default commands including migration helpers", () => {
        const runner = new CommandRunner();
        registerDefaultCommands(runner);

        const names = runner.getRegisteredCommands().map(cmd => cmd.name);
        assert.deepEqual(names, [
            "init",
            "make:migration",
            "migrate",
            "migrate:rollback",
            "migrate:refresh"
        ]);
    });
});
