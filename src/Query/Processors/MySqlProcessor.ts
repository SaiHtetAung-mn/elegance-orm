import Connection from "../../Connection/Connection";
import Model from "../../Model/Model";
import Processor from "./Processor";

class MySqlProcessor implements Processor {
    private connection: Connection;

    constructor() {
        this.connection = Connection.getInstance();
    }

    async processSelect<T extends Model>(query: string, bindings: any[], ModelClass: any): Promise<T[]> {
        if (typeof ModelClass?.hydrate !== "function") {
            throw new Error("Provided ModelClass must implement a static 'hydrate' method");
        }

        const records = await this.connection.select(query, bindings);
        const models = ModelClass.hydrate(records);
        return models;
    }

    async processInsertGetId(query: string, values: any[]): Promise<number | null> {
        const insertedId: (number | null) = await this.connection.insert(query, values);

        return insertedId;
    }

    async processUpdate(query: string, bindings: any[]): Promise<number> {
        const numberOfUpdatedRows = await this.connection.update(query, bindings);
        return numberOfUpdatedRows;
    }

    async processDelete(query: string, bindings: any[]): Promise<number> {
        const numberOfDeletedRows = await this.connection.delete(query, bindings);
        return numberOfDeletedRows;
    }

}

export default MySqlProcessor;
