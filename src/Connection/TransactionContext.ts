import { AsyncLocalStorage } from "async_hooks";
import { TransactionClient } from "./types";

class TransactionContext {
    private storage = new AsyncLocalStorage<TransactionClient>();

    run<T>(client: TransactionClient, callback: () => Promise<T>): Promise<T> {
        return this.storage.run(client, callback);
    }

    getClient(): TransactionClient | null {
        return this.storage.getStore() ?? null;
    }
}

export default new TransactionContext();
