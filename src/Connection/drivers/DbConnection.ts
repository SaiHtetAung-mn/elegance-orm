import { Config } from "../types";

abstract class DbConnection {
    protected config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    
    abstract select(query: string, bindings: any[]): Promise<any[]>;
    abstract insert(query: string, bindings: any[]): Promise<any>;
    abstract update(query: string, bindings: any[]): Promise<any>;
    abstract delete(query: string, bindings: any[]): Promise<any>;
}

export default DbConnection;