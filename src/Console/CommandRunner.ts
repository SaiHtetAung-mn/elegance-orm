import Command, { CommandArguments } from "./Command";

type RegisteredCommand = {
    name: string;
    description: string;
    instance: Command;
};

class CommandRunner {
    private commands: Map<string, RegisteredCommand> = new Map();

    register(command: Command): this {
        const name = command.getName();
        if (this.commands.has(name)) {
            throw new Error(`Command "${name}" is already registered.`);
        }

        this.commands.set(name, {
            name,
            description: command.description,
            instance: command
        });

        return this;
    }

    getRegisteredCommands(): Array<{ name: string; description: string }> {
        return Array.from(this.commands.values()).map(({ name, description }) => ({
            name,
            description
        }));
    }

    async run(argv: string[]): Promise<void> {
        const [, , commandName, ...args] = argv;

        if (!commandName) {
            throw new Error("No command provided. Use one of: " + this.availableCommandList());
        }

        const command = this.commands.get(commandName);
        if (!command) {
            throw new Error(`Unknown command "${commandName}". Use one of: ${this.availableCommandList()}`);
        }

        await command.instance.initialize();
        try {
            await command.instance.handle(args as CommandArguments);
        } finally {
            await command.instance.teardown();
        }
    }

    private availableCommandList(): string {
        if (this.commands.size === 0) {
            return "(no commands registered)";
        }

        return Array
            .from(this.commands.values())
            .map(cmd => cmd.name)
            .join(", ");
    }
}

export default CommandRunner;
