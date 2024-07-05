import { Config } from "../types";

abstract class DbConnection {
    protected connection: any;
    protected config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    
    abstract select(query: string, bindings: []): Promise<any[]>;
    abstract insert(query: string, bindings: []): Promise<any[]>;
    abstract update(query: string, bindings: []): Promise<any[]>;
}

export default DbConnection;