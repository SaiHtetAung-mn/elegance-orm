import QueryGrammar from "../Query/Grammars/Grammar";
import QueryProcessor from "../Query/Processors/Processor";
import SchemaGrammar from "../Schema/Grammars/Grammar";
import DbConnection from "./drivers/DbConnection";
import ConnectionFactory from "./factory/ConnectionFactory";
import QueryGrammarFactory from "./factory/QueryGrammarFactory";
import QueryProcessorFactory from "./factory/QueryProcessorFactory";
import { Config } from "./types";

let _instance: Connection | null = null;

class Connection {
    private connection!: DbConnection;
    private config!: Config;

    private constructor() {
        throw new Error("Cannot create connection instance directly");
    }

    public static getInstance(): Connection {
        if (_instance === null) {
            _instance = new Connection();
        }

        return _instance;
    }

    public initialize(config: Config, callback: () => void) {
        this.config = config;
        this.connection = ConnectionFactory.getConnection(this.config);
        this.connection
            .connect()
            .then(callback)
            .catch((err: any) => { throw err });
    }

    getQueryGrammar(): QueryGrammar {
        return QueryGrammarFactory.getQueryGrammar(this.config);
    }

    getQueryProcessor(): QueryProcessor {
        return QueryProcessorFactory.getProcessor(this.config);
    }

    getSchemaGrammar(): SchemaGrammar {
        throw new Error("Not implemented");
    }

    async rawQuery(query: string, bindings: any[] = []): Promise<void> {
        return await this.connection.rawQuery(query, bindings);
    }

    async select(query: string, bindings: any[]): Promise<any[]> {
        return await this.connection.select(query, bindings);
    }

    async insert(query: string, bindings: any[]): Promise<any> {
        return await this.connection.insert(query, bindings);
    }

    async update(query: string, bindings: any[]): Promise<number> {
        return await this.connection.update(query, bindings);
    }

    async delete(query: string, bindings: any[]): Promise<number> {
        return await this.connection.delete(query, bindings);
    }
}

export default Connection;