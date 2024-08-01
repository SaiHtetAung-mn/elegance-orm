import Model from "../../Model/Model";

interface Processor {
    processSelect<T extends Model>(query: string, bindings: any[], ModelClass: any): Promise<T[]>;
    processInsertGetId(query: string, values: any[]): Promise<number>;
}

export default Processor;