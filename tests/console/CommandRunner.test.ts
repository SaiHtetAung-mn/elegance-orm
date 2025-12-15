import { describe, it } from "mocha";
import { strict as assert } from "assert";
import Command from "../../src/Console/Command";
import CommandRunner from "../../src/Console/CommandRunner";

class TestCommand extends Command {
    public signature = "test";
    public description = "Runs the test command";
    public receivedArgs: string[] | null = null;
    public initialized = false;
    public tornDown = false;
    public shouldThrow = false;

    async initialize(): Promise<void> {
        this.initialized = true;
    }

    async handle(args: string[]): Promise<void> {
        if (this.shouldThrow) {
            throw new Error("boom");
        }
        this.receivedArgs = args;
    }

    async teardown(): Promise<void> {
        this.tornDown = true;
    }
}

describe("CommandRunner", () => {
    it("registers and executes commands", async () => {
        const runner = new CommandRunner();
        const command = new TestCommand();

        runner.register(command);
        await runner.run(["node", "cli", "test", "foo", "bar"]);

        assert.deepEqual(command.receivedArgs, ["foo", "bar"]);
        assert.equal(command.initialized, true);
        assert.equal(command.tornDown, true);

        const registered = runner.getRegisteredCommands();
        assert.equal(registered.length, 1);
        assert.equal(registered[0].name, "test");
    });

    it("throws when command is missing", async () => {
        const runner = new CommandRunner();

        await assert.rejects(
            () => runner.run(["node", "cli"]),
            /No command provided/
        );
    });

    it("throws for unknown commands", async () => {
        const runner = new CommandRunner();

        await assert.rejects(
            () => runner.run(["node", "cli", "unknown"]),
            /Unknown command/
        );
    });

    it("prevents duplicate command registration", () => {
        const runner = new CommandRunner();
        const first = new TestCommand();
        const second = new TestCommand();

        runner.register(first);
        assert.throws(() => runner.register(second), /already registered/);
    });

    it("invokes teardown even when handle throws", async () => {
        const runner = new CommandRunner();
        const command = new TestCommand();
        command.shouldThrow = true;

        runner.register(command);

        await assert.rejects(
            () => runner.run(["node", "cli", "test"]),
            /boom/
        );

        assert.equal(command.tornDown, true);
    });
});
