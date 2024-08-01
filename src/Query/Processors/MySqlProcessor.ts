import { ResultSetHeader } from "mysql2";
import Connection from "../../Connection/Connection";
import Model from "../../Model/Model";
import Processor from "./Processor";

class MySqlProcessor implements Processor {
    private connection: Connection;

    constructor() {
        this.connection = Connection.getInstance();
    }

    async processSelect<T extends Model>(query: string, bindings: any[], ModelClass: any): Promise<T[]> {
        const records = await this.connection.select(query, bindings);
        const models = ModelClass.hydrate(records);
        return models;
    }

    async processInsertGetId(query: string, values: any[]): Promise<number> {
        const result: ResultSetHeader = await this.connection.insert(query, values);
        return result.insertId;
    }
    
}

export default MySqlProcessor;