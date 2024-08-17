import Connection from "../../Connection/Connection";
import Model from "../../Model/Model";
import Processor from "./Processor";

class PostgreSqlProcessor implements Processor {
    private connection;

    constructor() {
        this.connection = Connection.getInstance();
    }
    processDelete(query: string, bindings: any[]): Promise<number> {
        throw new Error("Method not implemented.");
    }
    processUpdate(query: string, bindings: any[]): Promise<number> {
        throw new Error("Method not implemented.");
    }
    
    processInsert<T extends Model>(query: string, bindings: any[], ModelClass: any): Promise<T[]> {
        throw new Error("Method not implemented.");
    }

    async processSelect<T extends Model>(query: string, bindings: any[]): Promise<T[]> {
        throw new Error();
    }

    processInsertGetId(query: string, values: any[]): Promise<number> {
        throw new Error("Method not implemented.");
    }
    
}

export default PostgreSqlProcessor;