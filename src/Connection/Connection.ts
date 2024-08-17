import Grammar from "../Query/Grammars/Grammar";
import Processor from "../Query/Processors/Processor";
import DbConnection from "./drivers/DbConnection";
import ConnectionFactory from "./factory/ConnectionFactory";
import GrammarFactory from "./factory/GrammarFactory";
import QueryProcessorFactory from "./factory/QueryProcessorFactory";
import { Config } from "./types";

let _instance: Connection|null = null;

class Connection {
    private connection!: DbConnection;
    private config!: Config;

    private constructor() {
        
    }

    public static getInstance(): Connection {
        if(_instance === null) {
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

    getGrammar(): Grammar {
        return GrammarFactory.getGrammar(this.config);
    }

    getQueryProcessor(): Processor {
        return QueryProcessorFactory.getProcessor(this.config);
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