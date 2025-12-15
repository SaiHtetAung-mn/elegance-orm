export type CommandArguments = string[];

abstract class Command {
    abstract signature: string;
    abstract description: string;

    protected parseSignature(): { name: string } {
        const [name] = this.signature.trim().split(/\s+/);
        if (!name) {
            throw new Error(`Invalid command signature "${this.signature}"`);
        }

        return { name };
    }

    getName(): string {
        return this.parseSignature().name;
    }

    async initialize(): Promise<void> {
        // hook for child classes that need setup
    }

    async teardown(): Promise<void> {
        // hook for teardown
    }

    abstract handle(args: CommandArguments): Promise<void> | void;
}

export default Command;
