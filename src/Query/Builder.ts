import Grammar from "./Grammar/Grammar";
import MySqlGrammar from "./Grammar/MySqlGrammar";
import operatorEnum from "./enums/operator";
import { QueryObjType } from "./types";

class Builder<T> {
    protected readonly queryObj: QueryObjType = {
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

    private grammar: Grammar;

    constructor(table: string) {
        this.queryObj.from = table;
        this.grammar = new MySqlGrammar();
    }

    getQueryObj(): QueryObjType {
        return this.queryObj;
    }

    /** Query methods  */
    all(): Promise<T[]> {
        throw new Error("Method not implemented");
    }

    find(id: string|number): Promise<T> {
        throw new Error("Method not implemented");
    }

    first(): Promise<T> {
        throw new Error("Method not implemented");
    }

    get(): Promise<T[]> {
        throw new Error("Method not implemented");
    }

    /** Aggregation methods */
    count(): Promise<number> {
        throw new Error("Method not implemented");
    }

    sum(column: string): Promise<number> {
        throw new Error("Method not implemented");
    }

    avg(column: string): Promise<number> {
        throw new Error("Method not implemented");
    }

    min(column: string): Promise<number> {
        throw new Error("Method not implemented");
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
        this.queryObj.wheres.push({ column, operator: operator as operatorEnum, value, boolean, type: "basic" });

        return this;
    }

    orWhere(column: string, operator: `${operatorEnum}`|null, value: any): this {
        this.queryObj.wheres.push({ column, operator: operator as operatorEnum, value, boolean: "or", type: "basic" });

        return this;
    }

    andWhere(column: string, operator: `${operatorEnum}`|null, value: any): this {
        this.queryObj.wheres.push({ column, operator: operator as operatorEnum, value, boolean: "and", type: "basic" });

        return this;
    }

    whereIn(column: string, value: any[]): this {
        this.queryObj.wheres.push({ column, operator: operatorEnum.IN, value, boolean: "and", type: "in" });

        return this;
    }

    whereNotIn(column: string, value: any[]): this {
        this.queryObj.wheres.push({ column, operator: operatorEnum.NOT_IN, value, boolean: "and", type: "in" });

        return this;
    }

    whereBetween(column: string, values: [value1: any, value2: any]): this {
        this.queryObj.wheres.push({ column, operator: operatorEnum.BETWEEN, value: values, boolean: "and", type: "between" });

        return this;
    }

    whereNotBetween(column: string, values: [value1: any, value2: any]): this {
        this.queryObj.wheres.push({ column, operator: operatorEnum.NOT_BETWEEN, value: values, boolean: "and", type: "between" });

        return this;
    }

    whereNull(column: string): this {
        this.queryObj.wheres.push({ column, operator: null, value: null, boolean: "and", type: "null" });

        return this;
    }

    whereNotNull(column: string): this {
        this.queryObj.wheres.push({ column, operator: null, value: null, boolean: "and", type: "not_null" });

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

    having(column: string, operator: `${operatorEnum}`, value: any, boolean: "and"|"or"): this {
        this.queryObj.havings.push({ column, operator: operator as operatorEnum, value, boolean, type: "basic" });

        return this;
    }

    limit(value: number): this {
        this.queryObj.limit = value;

        return this;
    }

    /** Update, Delete */
    update(values: { column: string, value: any }[]): Promise<T> {
        throw new Error("Method not implemented");
    }

    delete(): Promise<void> {
        throw new Error("Method not implemented");
    }
}

export default Builder;