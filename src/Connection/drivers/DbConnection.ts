import { ConnectionOptions, TransactionCallback } from "../types";

abstract class DbConnection {
    protected config: ConnectionOptions;

    constructor(config: ConnectionOptions) {
        this.config = config;
    }

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    
    abstract select(query: string, bindings: any[]): Promise<any[]>;
    abstract insert(query: string, bindings: any[]): Promise<any>;
    abstract update(query: string, bindings: any[]): Promise<any>;
    abstract delete(query: string, bindings: any[]): Promise<any>;
    abstract rawQuery(query: string, bindings: any[]): Promise<any>;

    abstract transaction<T>(callback: TransactionCallback<T>): Promise<T>;
}

export default DbConnection;
