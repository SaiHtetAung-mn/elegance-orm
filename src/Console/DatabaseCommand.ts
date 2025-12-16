import Connection from "../Connection/Connection";
import { ConnectionOptions } from "../Connection/types";
import Command from "./Command";
import { getConfig } from "./config";

abstract class DatabaseCommand extends Command {
    protected config!: ConnectionOptions;

    async initialize(): Promise<void> {
        this.config = getConfig();
        await Connection.initialize(this.config);
    }

    async teardown(): Promise<void> {
        if (Connection.isInitialized()) {
            await Connection.disconnect();
        }
    }
}

export default DatabaseCommand;
