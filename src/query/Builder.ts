import Connection from "@connection/Connection";
import Model from "@model/Model";
import Grammar from "@query/grammars/Grammar";
import Processor from "@query/processors/Processor";
import operatorEnum from "@query/enums/operator";
import { QueryObjType } from "@query/types";
import type {
    ModelQueryMetadata,
    SoftDeleteConstraint,
    TrashedMode
} from "@model/types";

class Builder<T extends Model> {
    protected readonly queryObj: QueryObjType = {
        primaryKey: "id",
        aggregate: null,
        selects: [],
        distinct: false,
        from: "",
        alias: null,
        joins: [],
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
    private readonly modelMetadata: ModelQueryMetadata;
    private trashedMode: TrashedMode = "without";
    private connection: Connection;
    private grammar: Grammar;
    private processor: Processor;

    constructor(model: T, metadata: ModelQueryMetadata) {
        this.model = model;
        this.modelMetadata = metadata;
        this.queryObj.from = model.getTable();
        this.queryObj.primaryKey = model.getPrimaryKey();
        this.connection = Connection.getInstance();
        this.grammar = this.connection.getQueryGrammar();
        this.processor = this.connection.getQueryProcessor();
    }

    getQueryObj(): QueryObjType {
        return this.queryObj;
    }

    getSoftDeleteConstraint(useAlias = true): SoftDeleteConstraint | null {
        if (!this.modelMetadata.softDeletes || this.trashedMode === "with") {
            return null;
        }

        const column = this.modelMetadata.deletedAtColumn;
        const qualifier = useAlias
            ? this.queryObj.alias ?? this.queryObj.from
            : this.queryObj.from;

        return {
            column: column.includes(".") ? column : `${qualifier}.${column}`,
            trashed: this.trashedMode === "only"
        };
    }

    as(alias: string): this {
        this.queryObj.alias = alias;
        return this;
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
        try {
            const data = await this.get();
            return data.length > 0 ? data[0] : null;
        } finally {
            this.queryObj.limit = previousLimit;
        }
    }

    async get(): Promise<T[]> {
        const query = this.grammar.compileSelect(this);
        const binding = [...this.binding.where, ...this.binding.having];
        try {
            return await this.processor.processSelect<T>(query, binding, this.model.constructor);
        } finally {
            this.resetBindings();
        }
    }

    async insertGetId(attributes: Record<string, any>): Promise<number | null> {
        const columns: string[] = Object.keys(attributes);
        const values: any[] = columns.map(column => (attributes as Record<string, any>)[column]);
        const query: string = this.grammar.compileInsert(this, columns);

        return await this.processor.processInsertGetId(query, values);
    }

    async insert(records: Record<string, any>[]): Promise<void> {
        if (!Array.isArray(records) || records.length === 0) {
            throw new Error("The 'insert' method requires at least one record.");
        }

        const columns = Object.keys(records[0] ?? {});
        if (columns.length === 0) {
            throw new Error("Bulk insert requires records with at least one column.");
        }

        const bindings: any[] = [];
        records.forEach((record, index) => {
            this.ensureConsistentColumns(columns, record, index);
            columns.forEach(column => {
                bindings.push(record[column]);
            });
        });

        const query: string = this.grammar.compileInsert(this, columns, records.length);
        await this.connection.rawQuery(query, bindings);
    }

    async update(attributes: Partial<T>): Promise<number> {
        return await this.executeUpdate(attributes as Record<string, any>);
    }

    async delete(): Promise<number> {
        if (this.modelMetadata.softDeletes) {
            return await this.executeUpdate({
                [this.modelMetadata.deletedAtColumn]: this.currentTimestamp()
            });
        }

        return await this.executeDelete();
    }

    withTrashed(include = true): this {
        this.requireSoftDeletes("withTrashed");
        this.trashedMode = include ? "with" : "without";
        return this;
    }

    withoutTrashed(): this {
        this.requireSoftDeletes("withoutTrashed");
        this.trashedMode = "without";
        return this;
    }

    onlyTrashed(): this {
        this.requireSoftDeletes("onlyTrashed");
        this.trashedMode = "only";
        return this;
    }

    async restore(): Promise<number> {
        this.requireSoftDeletes("restore");
        const previousMode = this.trashedMode;
        this.trashedMode = "only";

        try {
            return await this.executeUpdate({
                [this.modelMetadata.deletedAtColumn]: null
            });
        } finally {
            this.trashedMode = previousMode;
        }
    }

    async forceDelete(): Promise<number> {
        this.requireSoftDeletes("forceDelete");
        return await this.executeDelete();
    }

    private async executeUpdate(attributes: Record<string, any>): Promise<number> {
        const columns = Object.keys(attributes);
        if (columns.length === 0) {
            throw new Error("The 'update' method requires at least one attribute.");
        }

        const values = columns.map(column => attributes[column]);
        const sql = this.grammar.compileUpdate(this, columns);
        const bindings = [...values, ...this.binding.where];

        try {
            return await this.processor.processUpdate(sql, bindings);
        } finally {
            this.resetBindings();
        }
    }

    private async executeDelete(): Promise<number> {
        const sql: string = this.grammar.compileDelete(this);
        const bindings: any[] = [...this.binding.where];

        try {
            return await this.processor.processDelete(sql, bindings);
        } finally {
            this.resetBindings();
        }
    }

    private requireSoftDeletes(method: string): void {
        if (!this.modelMetadata.softDeletes) {
            throw new Error(`${method}() is only available on models with soft deletes enabled.`);
        }
    }

    private currentTimestamp(): string {
        return new Date().toISOString().replace("T", " ").substring(0, 19);
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

    private ensureConsistentColumns(columns: string[], record: Record<string, any>, index: number): void {
        const recordColumns = Object.keys(record);
        if (recordColumns.length !== columns.length) {
            throw new Error(`Record at position ${index} must define the same columns as the first record.`);
        }

        for (const column of columns) {
            if (!(column in record)) {
                throw new Error(`Record at position ${index} is missing the '${column}' column required for bulk insert.`);
            }
        }
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

        let result: any[];
        try {
            const sql = this.grammar.compileSelect(this);
            result = await this.connection.select(sql, [...this.binding.where, ...this.binding.having]);
        } finally {
            this.resetBindings();
            this.queryObj.aggregate = original.aggregate;
            this.queryObj.selects = original.selects;
            this.queryObj.orders = original.orders;
            this.queryObj.limit = original.limit;
            this.queryObj.offset = original.offset;
        }

        if (result.length === 0)
            return 0;

        const aggregateValue = result[0]["aggregate"];
        return typeof aggregateValue === "number" ? aggregateValue : Number(aggregateValue);
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

    /** Join methods */
    join(
        table: string,
        first: string,
        operator: `${operatorEnum}` | null,
        second: string,
        type: "inner" | "left" = "inner"
    ): this {
        if (!table || !first || !second) {
            throw new Error("The 'join' method requires table and column arguments");
        }

        const resolvedOperator = (operator ?? operatorEnum.EQUAL) as operatorEnum;
        this.queryObj.joins.push({
            type,
            table,
            clauses: [{
                first,
                operator: resolvedOperator,
                second,
                boolean: "and"
            }]
        });

        return this;
    }

    leftJoin(
        table: string,
        first: string,
        operator: `${operatorEnum}` | null,
        second: string
    ): this {
        return this.join(table, first, operator, second, "left");
    }

    innerJoin(
        table: string,
        first: string,
        operator: `${operatorEnum}` | null,
        second: string
    ): this {
        return this.join(table, first, operator, second, "inner");
    }
}

export default Builder;
