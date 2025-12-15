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
        this.grammar = this.connection.getQueryGrammar();
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

    async find(id: string | number): Promise<T | null> {
        return await this
            .where(this.queryObj.primaryKey, "=", id)
            .first();
    }

    async first(): Promise<T | null> {
        const previousLimit = this.queryObj.limit;
        this.limit(1);
        const data = await this.get();
        this.queryObj.limit = previousLimit;
        return data.length > 0 ? data[0] : null;
    }

    async get(): Promise<T[]> {
        const query = this.grammar.compileSelect(this);
        const binding = [...this.binding.where, ...this.binding.having];
        const data: T[] = await this.processor.processSelect<T>(query, binding, this.model.constructor);
        this.resetBindings();
        return data;
    }

    async insertGetId(attributes: Record<string, any>): Promise<number | null> {
        const columns: string[] = Object.keys(attributes);
        const values: any[] = columns.map(column => (attributes as Record<string, any>)[column]);
        const query: string = this.grammar.compileInsert(this, columns);

        return await this.processor.processInsertGetId(query, values);
    }

    async update(attributes: Partial<T>): Promise<number> {
        const columns: string[] = Object.keys(attributes as Record<string, any>);
        const values: any[] = columns.map(column => (attributes as Record<string, any>)[column]);
        const sql: string = this.grammar.compileUpdate(this, columns);
        const bindings: any[] = [...values, ...this.binding.where];

        const affected = await this.processor.processUpdate(sql, bindings);
        this.resetBindings();
        return affected;
    }

    async delete(): Promise<number> {
        const sql: string = this.grammar.compileDelete(this);
        const bindings: any[] = [...this.binding.where];

        const deleted = await this.processor.processDelete(sql, bindings);
        this.resetBindings();
        return deleted;
    }

    /** Aggregation methods */
    async count(column: string = "*"): Promise<number> {
        return await this.aggregate("count", column);
    }

    async sum(column: string): Promise<number> {
        if (!column)
            throw new Error("The 'sum' method requires one argument");

        return await this.aggregate("sum", column);
    }

    async avg(column: string): Promise<number> {
        if (!column)
            throw new Error("The 'avg' method requires one argument");

        return await this.aggregate("avg", column);
    }

    async min(column: string): Promise<number> {
        if (!column)
            throw new Error("The 'min' method requires at least one argument");

        return await this.aggregate("min", column);
    }

    async max(column: string): Promise<number> {
        if (!column)
            throw new Error("The 'max' method requires at least one argument");

        return await this.aggregate("max", column);
    }

    private setAggregate(functionName: "count" | "max" | "min" | "avg" | "sum", column: string): this {
        this.queryObj.aggregate = { "function": functionName, column };
        return this;
    }

    private normalizeColumns(columns: Array<string | string[]>): string[] {
        const normalized: string[] = [];
        columns.forEach((column) => {
            if (Array.isArray(column)) {
                normalized.push(...column);
            } else if (column) {
                normalized.push(column);
            }
        });

        return normalized;
    }

    private resetBindings(): void {
        this.binding = { where: [], having: [] };
    }

    private async aggregate(functionName: "count" | "max" | "min" | "avg" | "sum", column: string): Promise<number> {
        const original = {
            aggregate: this.queryObj.aggregate,
            selects: [...this.queryObj.selects],
            orders: [...this.queryObj.orders],
            limit: this.queryObj.limit,
            offset: this.queryObj.offset
        };

        this.setAggregate(functionName, column);
        this.queryObj.selects = [];
        this.queryObj.orders = [];
        this.queryObj.limit = null;
        this.queryObj.offset = null;

        const sql = this.grammar.compileSelect(this);
        const result = await this.connection.select(sql, [...this.binding.where, ...this.binding.having]);
        this.resetBindings();

        this.queryObj.aggregate = original.aggregate;
        this.queryObj.selects = original.selects;
        this.queryObj.orders = original.orders;
        this.queryObj.limit = original.limit;
        this.queryObj.offset = original.offset;

        return result.length == 0 ? 0 : result[0]["aggregate"];
    }

    /** Projection methods */
    select(...columns: Array<string | string[]>): this {
        this.queryObj.selects.push(...this.normalizeColumns(columns));
        return this;
    }

    addSelect(...columns: Array<string | string[]>): this {
        return this.select(...columns);
    }

    distinct(): this {
        this.queryObj.distinct = true;
        return this;
    }

    /** Filtering methods */
    where(column: string, operator: `${operatorEnum}`, value: any, boolean: "and" | "or" = "and"): this {
        this.queryObj.wheres.push({
            column,
            operator: operator as operatorEnum,
            value,
            boolean,
            type: "basic"
        }
        );

        this.binding.where.push(value);

        return this;
    }

    orWhere(column: string, operator: `${operatorEnum}` | null, value: any): this {
        const resolvedOperator = (operator ?? operatorEnum.EQUAL) as `${operatorEnum}`;
        this.queryObj.wheres.push({
            column,
            operator: resolvedOperator as operatorEnum,
            value,
            boolean: "or",
            type: "basic"
        });

        this.binding.where.push(value);

        return this;
    }

    andWhere(column: string, operator: `${operatorEnum}` | null, value: any): this {
        const resolvedOperator = (operator ?? operatorEnum.EQUAL) as `${operatorEnum}`;
        return this.where(column, resolvedOperator, value, "and");
    }

    whereIn(column: string, value: any[]): this {
        if (!Array.isArray(value) || value.length === 0) {
            throw new Error("The 'whereIn' method requires a non-empty array of values");
        }

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
        if (!Array.isArray(value) || value.length === 0) {
            throw new Error("The 'whereNotIn' method requires a non-empty array of values");
        }

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
        if (!Array.isArray(values) || values.length !== 2) {
            throw new Error("The 'whereBetween' method requires exactly two values");
        }

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
        if (!Array.isArray(values) || values.length !== 2) {
            throw new Error("The 'whereNotBetween' method requires exactly two values");
        }

        this.queryObj.wheres.push({
            column,
            operator: operatorEnum.NOT_BETWEEN,
            value: values,
            boolean: "and",
            type: "not_between"
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

    /** Ordering, Grouping and limit */
    orderBy(column: string, direction: "asc" | "desc" = "asc"): this {
        this.queryObj.orders.push({ column, direction });

        return this;
    }

    groupBy(...columns: Array<string | string[]>): this {
        this.queryObj.groups.push(...this.normalizeColumns(columns));

        return this;
    }

    having(column: string, operator: `${operatorEnum}`, value: any, boolean: "and" | "or" = "and"): this {
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

    offset(value: number): this {
        this.queryObj.offset = value;

        return this;
    }

    limit(value: number): this {
        this.queryObj.limit = value;

        return this;
    }

    orderByDesc(column: string): this {
        return this.orderBy(column, "desc");
    }

    latest(column: string = this.queryObj.primaryKey): this {
        return this.orderBy(column, "desc");
    }

    oldest(column: string = this.queryObj.primaryKey): this {
        return this.orderBy(column, "asc");
    }
}

export default Builder;
