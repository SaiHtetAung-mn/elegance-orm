import Model from "../../model/Model";

interface Processor {
    processSelect<T extends Model>(query: string, bindings: any[], ModelClass: any): Promise<T[]>;
    processInsertGetId(query: string, values: any[]): Promise<number|null>;
    processUpdate(query: string, bindings: any[]): Promise<number>;
    processDelete(query: string, bindings: any[]): Promise<number>;
}

export default Processor;