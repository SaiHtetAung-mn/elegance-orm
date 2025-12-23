import Connection from "./Connection";
import { ConnectionOptions, TransactionCallback } from "./types";

class DataSource {
    private initialized = false;

    constructor(private readonly options: ConnectionOptions) { }

    getConfig(): ConnectionOptions {
        return this.options;
    }

    async initialize(callback?: () => void): Promise<void> {
        await Connection.initialize(this.options, callback);
        this.initialized = true;
    }

    async destroy(): Promise<void> {
        if (!this.initialized) {
            return;
        }

        await Connection.disconnect();
        this.initialized = false;
    }

    isInitialized(): boolean {
        return Connection.isInitialized();
    }

    private requireConnection(): Connection {
        return Connection.getInstance();
    }

    async rawQuery<T = any>(query: string, bindings: any[] = []): Promise<T> {
        return await this.requireConnection().rawQuery<T>(query, bindings);
    }

    async select(query: string, bindings: any[] = []): Promise<any[]> {
        return await this.requireConnection().select(query, bindings);
    }

    async insert(query: string, bindings: any[] = []): Promise<any> {
        return await this.requireConnection().insert(query, bindings);
    }

    async update(query: string, bindings: any[]): Promise<number> {
        return await this.requireConnection().update(query, bindings);
    }

    async delete(query: string, bindings: any[]): Promise<number> {
        return await this.requireConnection().delete(query, bindings);
    }

    async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
        return await this.requireConnection().transaction(callback);
    }
}

export default DataSource;
