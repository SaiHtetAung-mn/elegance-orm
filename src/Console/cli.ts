#!/usr/bin/env node
import CommandRunner from "./CommandRunner";
import { registerDefaultCommands } from "./registerCommands";

async function run() {
    const runner = new CommandRunner();
    registerDefaultCommands(runner);

    try {
        await runner.run(process.argv);
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}

run();
