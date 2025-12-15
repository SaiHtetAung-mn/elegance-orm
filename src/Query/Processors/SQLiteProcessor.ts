import Connection from "../../Connection/Connection";
import Model from "../../Model/Model";
import Processor from "./Processor";

class SQLiteProcessor implements Processor {
    private connection: Connection;

    constructor() {
        this.connection = Connection.getInstance();
    }

    async processSelect<T extends Model>(query: string, bindings: any[], ModelClass: any): Promise<T[]> {
        if (typeof ModelClass?.hydrate !== "function") {
            throw new Error("Provided ModelClass must implement a static 'hydrate' method");
        }

        const records = await this.connection.select(query, bindings);
        return ModelClass.hydrate(records);
    }

    async processInsertGetId(query: string, values: any[]): Promise<number | null> {
        return await this.connection.insert(query, values);
    }

    async processUpdate(query: string, bindings: any[]): Promise<number> {
        return await this.connection.update(query, bindings);
    }

    async processDelete(query: string, bindings: any[]): Promise<number> {
        return await this.connection.delete(query, bindings);
    }
}

export default SQLiteProcessor;
