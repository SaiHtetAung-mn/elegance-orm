import Grammar from "../Query/Grammar/Grammar";
import DbConnection from "./drivers/DbConnection";
import ConnectionFactory from "./factory/ConnectionFactory";
import GrammarFactory from "./factory/GrammarFactory";
import { Config } from "./types";

let _instance: Connection|null = null;

class Connection {
    private static instance: Connection|null = null;
    private connection: DbConnection|null = null;
    private config: any;

    private constructor(config: Config) {
        if(_instance === null) {
            _instance = new Connection(config);
        }

        return _instance;
    }

    getGrammar(): Grammar {
        return GrammarFactory.getGrammar(this.config);
    }

    async select(query: string, bindings: []): Promise<any[]> {
        return await this.connection?.select(query, bindings);
    }

    // insert(query: string, bindings: []): Promise<any[]>;
    // update(query: string, bindings: []): Promise<any[]>;
}

export default Connection;