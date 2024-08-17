import Connection from "../Connection/Connection";
import Model from "../Model/Model";
import Grammar from "./Grammars/Grammar";
import Processor from "./Processors/Processor";
import operatorEnum from "./enums/operator";
import { QueryObjType } from "./types";

class Builder<T extends Model> {
    protected readonly queryObj: QueryObjType = {
        primaryKey: "id",
        aggregate: null,
        selects: [],
        distinct: false,
        from: "",
        wheres: [],
        groups: [],
        havings: [],
        orders: [],
        limit: null,
        offset: null
    };

    private binding: { where: any[], having: any[] } = {
        where: [],
        having: []
    }

    private model: T;
    private connection: Connection;
    private grammar: Grammar;
    private processor: Processor;

    constructor(model: T) {
        this.model = model;
        this.queryObj.from = model.getTable();
        this.queryObj.primaryKey = model.getPrimaryKey();
        this.connection = Connection.getInstance();
        this.grammar = this.connection.getGrammar();
        this.processor = this.connection.getQueryProcessor();
    }

    getQueryObj(): QueryObjType {
        return this.queryObj;
    }

    toSql(): string {
        return this.grammar.compileSelect(this);
    }

    /** Query methods  */

    async create(attributes: Record<string, any>): Promise<T> {
        const newModelInstance = this.model.newInstance(attributes);
        await newModelInstance.save();
        return newModelInstance;
    }

    async find(id: string|number): Promise<T|null> {
        return await this
            .where(this.queryObj.primaryKey, "=", id)
            .first();
    }

    async first(): Promise<T|null> {
        const data = await this.limit(1).get();
        return data.length > 0 ? data[0] : null;
    }

    async get(): Promise<T[]> {
        const query = this.grammar.compileSelect(this);
        const binding = [...this.binding.where, ...this.binding.having];
        const data: T[] = await this.processor.processSelect<T>(query, binding, this.model.constructor);
        return data;
    }

    async insertGetId(attributes: Record<string, any>): Promise<number|null> {
        const values: any[] = Object.values(attributes);
        const columns: string[] = Object.keys(attributes);
        const query: string = this.grammar.compileInsert(this, columns);

        return await this.processor.processInsertGetId(query, values);
    }

    async update(attributes: Partial<T>): Promise<number> {
        const values: any[] = Object.values(attributes);
        const columns: string[] = Object.keys(attributes);
        const sql: string = this.grammar.compileUpdate(this, columns);
        const bindings: any[] = [...values, ...this.binding.where];

        return await this.processor.processUpdate(sql, bindings);
    }

    async delete(): Promise<number> {
        const sql: string = this.grammar.compileDelete(this);
        const bindings: any[] = [...this.binding.where];

        return await this.processor.processDelete(sql, bindings);
    }

    /** Aggregation methods */
    async count(column: string = "*"): Promise<number> {
        return await this.aggregate("count", column);
    }

    async sum(column: string): Promise<number> {
        if(!column)
            throw new Error("The 'sum' method requires one argument");

        return await this.aggregate("sum", column);
    }

    async avg(column: string): Promise<number> {
        if(!column)
            throw new Error("The 'sum' method requires one argument");

        return await this.aggregate("avg", column);
    }

    async min(column: string): Promise<number> {
        if(!column)
            throw new Error("The 'min' method requires at least one argument");

        return await this.aggregate("min", column);
    }

    async max(column: string): Promise<number> {
        if(!column)
            throw new Error("The 'max' method requires at least one argument");

        return await this.aggregate("max", column);
    }

    private setAggregate(functionName: "count"|"max"|"min"|"avg"|"sum", column: string): this {
        this.queryObj.aggregate = { "function": functionName, column };
        return this;
    }

    private async aggregate(functionName: "count"|"max"|"min"|"avg"|"sum", column: string): Promise<number> {
        this.setAggregate(functionName, column);

        this.queryObj.selects = [];
        this.queryObj.orders = [];
        this.queryObj.limit = null;

        const sql = this.grammar.compileSelect(this);
        const result = await this.connection.select(sql, [...this.binding.where, ...this.binding.having]);

        return result.length == 0 ? 0 : result[0]["aggregate"];
    }

    /** Projection methods */
    select(columns: string[]): this {
        this.queryObj.selects.push(...columns);
        return this;
    }

    distinct(): this {
        this.queryObj.distinct = true;
        return this;
    }

    /** Filtering methods */
    where(column: string, operator: `${operatorEnum}`, value: any, boolean: "and"|"or" = "and"): this {
        this.queryObj.wheres.push({ 
            column, 
            operator: operator as operatorEnum, 
            value, 
            boolean, 
            type: "basic" }
        );

        this.binding.where.push(value);

        return this;
    }

    orWhere(column: string, operator: `${operatorEnum}`|null, value: any): this {
        this.queryObj.wheres.push({ 
            column, 
            operator: operator as operatorEnum, 
            value, 
            boolean: "or", 
            type: "basic" 
        });

        this.binding.where.push(value);

        return this;
    }

    andWhere(column: string, operator: `${operatorEnum}`|null, value: any): this {
        this.queryObj.wheres.push({ 
            column, 
            operator: operator as operatorEnum, 
            value, 
            boolean: "and", 
            type: "basic" 
        });

        this.binding.where.push(value);

        return this;
    }

    whereIn(column: string, value: any[]): this {
        this.queryObj.wheres.push({ 
            column, 
            operator: operatorEnum.IN, 
            value, 
            boolean: "and", 
            type: "in" 
        });

        this.binding.where.push(...value);

        return this;
    }

    whereNotIn(column: string, value: any[]): this {
        this.queryObj.wheres.push({ 
            column, 
            operator: operatorEnum.NOT_IN, 
            value, 
            boolean: "and", 
            type: "in" 
        });

        this.binding.where.push(...value);

        return this;
    }

    whereBetween(column: string, values: [value1: any, value2: any]): this {
        this.queryObj.wheres.push({ 
            column, 
            operator: operatorEnum.BETWEEN, 
            value: values, 
            boolean: "and", 
            type: "between" 
        });

        this.binding.where.push(...values);

        return this;
    }

    whereNotBetween(column: string, values: [value1: any, value2: any]): this {
        this.queryObj.wheres.push({ 
            column, 
            operator: operatorEnum.NOT_BETWEEN, 
            value: values, 
            boolean: "and", 
            type: "between" 
        });

        this.binding.where.push(...values);

        return this;
    }

    whereNull(column: string): this {
        this.queryObj.wheres.push({ 
            column, 
            operator: null, 
            value: null, 
            boolean: "and", 
            type: "null" 
        });

        return this;
    }

    whereNotNull(column: string): this {
        this.queryObj.wheres.push({ 
            column, 
            operator: null, 
            value: null, 
            boolean: "and", 
            type: "not_null" 
        });

        return this;
    }

    // Join methods
    //join(table: string, localId: any, $operator, $second = null, $type = 'inner', $where = false)

    /** Ordering, Grouping and limit */
    orderBy(column: string, direction: "asc"|"desc"): this {
        this.queryObj.orders.push({ column, direction });

        return this;
    }

    groupBy(columns: string[]): this {
        this.queryObj.groups.push(...columns);

        return this;
    }

    having(column: string, operator: `${operatorEnum}`, value: any, boolean: "and"|"or" = "and"): this {
        this.queryObj.havings.push({ 
            column, 
            operator: operator as operatorEnum, 
            value, 
            boolean, 
            type: "basic" 
        });

        this.binding.having.push(value);

        return this;
    }

    limit(value: number): this {
        this.queryObj.limit = value;

        return this;
    }
}

export default Builder;