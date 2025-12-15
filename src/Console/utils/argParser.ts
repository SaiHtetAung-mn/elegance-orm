export type ParsedArgs = {
    positional: string[];
    options: Record<string, string | boolean>;
};

export function parseCommandArgs(args: string[]): ParsedArgs {
    const positional: string[] = [];
    const options: Record<string, string | boolean> = {};

    args.forEach(arg => {
        if (arg.startsWith("--")) {
            const [key, value] = arg.slice(2).split("=");
            options[key] = value === undefined ? true : value;
        } else {
            positional.push(arg);
        }
    });

    return { positional, options };
}
