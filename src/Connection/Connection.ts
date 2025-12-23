import QueryGrammar from "../query/grammars/Grammar";
import QueryProcessor from "../query/processors/Processor";
import SchemaGrammar from "../schema/grammars/Grammar";
import DbConnection from "./drivers/DbConnection";
import ConnectionFactory from "./factory/ConnectionFactory";
import QueryGrammarFactory from "./factory/QueryGrammarFactory";
import QueryProcessorFactory from "./factory/QueryProcessorFactory";
import SchemaGrammarFactory from "./factory/SchemaGrammarFactory";
import TransactionContext from "./TransactionContext";
import { ConnectionOptions, TransactionCallback, TransactionClient } from "./types";

class Connection {
    private connection: DbConnection | null = null;
    private config: ConnectionOptions | null = null;
    private queryGrammar: QueryGrammar | null = null;
    private queryProcessor: QueryProcessor | null = null;
    private schemaGrammar: SchemaGrammar | null = null;

    private constructor() { }

    public static async initialize(config: ConnectionOptions, callback?: () => void): Promise<Connection> {
        if (!this._instance) {
            this._instance = new Connection();
        }

        await this._instance.bootstrap(config, callback);

        return this._instance;
    }

    public static getInstance(): Connection {
        if (!this._instance) {
            throw new Error("Connection has not been initialized. Call Connection.initialize first.");
        }

        return this._instance;
    }

    public static isInitialized(): boolean {
        return this._instance !== null;
    }

    public static setInstance(instance: Connection | null): void {
        this._instance = instance;
    }

    public static async disconnect(): Promise<void> {
        if (this._instance) {
            await this._instance.teardown();
            this._instance = null;
        }
    }

    private static _instance: Connection | null = null;

    private async bootstrap(config: ConnectionOptions, callback?: () => void): Promise<void> {
        if (this.connection) {
            await this.teardown();
        }

        this.config = config;
        this.connection = ConnectionFactory.getConnection(this.config);
        await this.connection.connect();
        callback?.();
    }

    private async teardown(): Promise<void> {
        if (this.connection) {
            await this.connection.disconnect();
        }

        this.connection = null;
        this.queryGrammar = null;
        this.queryProcessor = null;
        this.schemaGrammar = null;
        this.config = null;
    }

    private requireConnection(): DbConnection {
        if (!this.connection) {
            throw new Error("Connection has not been initialized. Call Connection.initialize first.");
        }

        return this.connection;
    }

    private requireConfig(): ConnectionOptions {
        if (!this.config) {
            throw new Error("Connection has not been initialized. Call Connection.initialize first.");
        }

        return this.config;
    }

    getQueryGrammar(): QueryGrammar {
        if (!this.queryGrammar) {
            this.queryGrammar = QueryGrammarFactory.getQueryGrammar(this.requireConfig());
        }

        return this.queryGrammar;
    }

    getQueryProcessor(): QueryProcessor {
        if (!this.queryProcessor) {
            this.queryProcessor = QueryProcessorFactory.getProcessor(this.requireConfig());
        }

        return this.queryProcessor;
    }

    getSchemaGrammar(): SchemaGrammar {
        if (!this.schemaGrammar) {
            this.schemaGrammar = SchemaGrammarFactory.getSchemaGrammar(this.requireConfig());
        }

        return this.schemaGrammar;
    }

    private getActiveTransactionClient(): TransactionClient | null {
        return TransactionContext.getClient();
    }

    async rawQuery<T = any>(query: string, bindings: any[] = []): Promise<T> {
        const client = this.getActiveTransactionClient();
        if (client) {
            return await client.rawQuery<T>(query, bindings);
        }

        return await this.requireConnection().rawQuery(query, bindings);
    }

    async select(query: string, bindings: any[]): Promise<any[]> {
        const client = this.getActiveTransactionClient();
        if (client) {
            return await client.select(query, bindings);
        }

        return await this.requireConnection().select(query, bindings);
    }

    async insert(query: string, bindings: any[]): Promise<any> {
        const client = this.getActiveTransactionClient();
        if (client) {
            return await client.insert(query, bindings);
        }

        return await this.requireConnection().insert(query, bindings);
    }

    async update(query: string, bindings: any[]): Promise<number> {
        const client = this.getActiveTransactionClient();
        if (client) {
            return await client.update(query, bindings);
        }

        return await this.requireConnection().update(query, bindings);
    }

    async delete(query: string, bindings: any[]): Promise<number> {
        const client = this.getActiveTransactionClient();
        if (client) {
            return await client.delete(query, bindings);
        }

        return await this.requireConnection().delete(query, bindings);
    }

    async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
        const existingClient = this.getActiveTransactionClient();
        if (existingClient) {
            return await callback(existingClient);
        }

        return await this.requireConnection().transaction(async trxClient => {
            return await TransactionContext.run(trxClient, () => callback(trxClient));
        });
    }
}

export default Connection;
