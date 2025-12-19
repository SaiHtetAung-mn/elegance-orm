import type { RegisterOptions } from "ts-node";

let registered = false;

export function ensureTypeScriptSupport(): void {
    if (registered) {
        return;
    }

    try {
        const { register } = require("ts-node") as typeof import("ts-node");
        const options: RegisterOptions = {
            transpileOnly: true,
            compilerOptions: {
                esModuleInterop: true,
                module: "commonjs",
                moduleResolution: "node",
                target: "es2019"
            }
        };

        register(options);
        registered = true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code === "MODULE_NOT_FOUND") {
            throw new Error(
                "TypeScript support requires ts-node. Install ts-node or set the CLI language to \"javascript\" in elegance.config."
            );
        }

        throw error;
    }
}
