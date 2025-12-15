import Connection from "../Connection/Connection";
import Command from "./Command";
import { getConfig } from "./config";
import { MiniOrmConfig } from "../Migration/types";

abstract class DatabaseCommand extends Command {
    protected config!: MiniOrmConfig;

    async initialize(): Promise<void> {
        this.config = getConfig();
        await Connection.initialize(this.config.connection);
    }

    async teardown(): Promise<void> {
        if (Connection.isInitialized()) {
            await Connection.disconnect();
        }
    }
}

export default DatabaseCommand;
