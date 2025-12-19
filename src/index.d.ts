export type ConnectionDriver = "mysql" | "postgresql" | "sqlite";

export interface ConnectionOptions {
    driver: ConnectionDriver;
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    maxPoolSize?: number;
}

export type QueryOperator =
    "=" |
    "<>" |
    ">" |
    ">=" |
    "<" |
    "<=" |
    "like" |
    "not like" |
    "in" |
    "not in" |
    "between" |
    "not between";

export type QueryAggregateFunction = "count" | "sum" | "avg" | "min" | "max";
export type QueryCondition = "and" | "or";
export type JoinType = "inner" | "left";

export interface WhereClause {
    type: "basic" | "in" | "between" | "not_between" | "null" | "not_null";
    column: string;
    operator: QueryOperator | null;
    value: any;
    boolean: QueryCondition;
}

export interface OrderClause {
    column: string;
    direction: "asc" | "desc";
}

export interface JoinClauseCondition {
    first: string;
    operator: QueryOperator;
    second: string;
    boolean: QueryCondition;
}

export interface JoinClause {
    type: JoinType;
    table: string;
    clauses: JoinClauseCondition[];
}

export interface QueryObject {
    primaryKey: string;
    aggregate: { function: QueryAggregateFunction; column: string } | null;
    selects: string[];
    distinct: boolean;
    from: string;
    alias: string | null;
    joins: JoinClause[];
    wheres: WhereClause[];
    groups: string[];
    havings: WhereClause[];
    orders: OrderClause[];
    limit: number | null;
    offset: number | null;
}

export interface ColumnDefinitionAttributes {
    primary?: boolean;
    unique?: boolean;
    nullable?: boolean;
    default?: any;
    onUpdate?: any;
    unsigned?: boolean;
    autoIncrement?: boolean;
    length?: number;
    precision?: number;
    after?: string;
    first?: boolean;
    comment?: string;
    index?: boolean;
    useCurrent?: boolean;
    useCurrentOnUpdate?: boolean;
    change?: boolean;
}

export interface ColumnDefinition {
    getColumn(): string;
    getType(): "string" | "boolean" | "uuid" | "integer" | "tinyInteger" | "smallInteger" | "bigInteger" | "char" | "text" | "longText" | "float" | "double" | "date" | "datetime" | "year" | "time" | "timestamp" | "json" | "binary";
    nullable(value?: boolean): this;
    default(value: string | number | boolean): this;
    onUpdate(value: string | number | boolean): this;
    unsigned(value?: boolean): this;
    useCurrent(value?: boolean): this;
    useCurrentOnUpdate(value?: boolean): this;
    after(column: string): this;
    first(): this;
    comments(value: string): this;
    index(): this;
    primary(value?: boolean): this;
    unique(value?: boolean): this;
}

export interface ForeignKeyCommand {
    references(foreignColumn: string): this;
    on(referenceTable: string): this;
    onDelete(action: string): this;
    onUpdate(action: string): this;
}

export interface SchemaBlueprint {
    getTable(): string;
    foreign(column: string): ForeignKeyCommand;
    id(column?: string): ColumnDefinition;
    uuid(column: string): ColumnDefinition;
    increment(column: string): ColumnDefinition;
    bigIncrement(column: string): ColumnDefinition;
    smallIncrement(column: string): ColumnDefinition;
    char(column: string, length?: number): ColumnDefinition;
    string(column: string, length?: number): ColumnDefinition;
    text(column: string): ColumnDefinition;
    longText(column: string): ColumnDefinition;
    integer(column: string, unsigned?: boolean, autoIncrement?: boolean): ColumnDefinition;
    bigInteger(column: string, unsigned?: boolean, autoIncrement?: boolean): ColumnDefinition;
    smallInteger(column: string, unsigned?: boolean, autoIncrement?: boolean): ColumnDefinition;
    float(column: string, precision?: number): ColumnDefinition;
    double(column: string): ColumnDefinition;
    boolean(column: string): ColumnDefinition;
    date(column: string): ColumnDefinition;
    dateTime(column: string): ColumnDefinition;
    time(column: string): ColumnDefinition;
    timestamp(column: string): ColumnDefinition;
    timestamps(): void;
    year(column: string): ColumnDefinition;
    json(column: string): ColumnDefinition;
    binary(column: string): ColumnDefinition;
    create(): void;
    index(columns: string[] | string, name?: string | null): void;
    primary(columns: string[] | string, name?: string | null): void;
    unique(columns: string[] | string, name?: string | null): void;
    drop(): void;
    dropColumns(columns: string[]): void;
    dropIfExists(): void;
    dropPrimary(index: string | string[]): void;
    dropUnique(index: string | string[]): void;
    dropIndex(index: string | string[]): void;
    dropForeign(index: string | string[]): void;
    renameColumn(from: string, to: string): void;
    toSql(): string[];
}

export class MassAssignmentException extends Error {
    constructor(message: string);
}

export class DataSource {
    constructor(options: ConnectionOptions);
    getConfig(): ConnectionOptions;
    initialize(callback?: () => void): Promise<void>;
    destroy(): Promise<void>;
    isInitialized(): boolean;
    rawQuery<T = any>(query: string, bindings?: any[]): Promise<T>;
    select(query: string, bindings?: any[]): Promise<any[]>;
    insert(query: string, bindings?: any[]): Promise<any>;
    update(query: string, bindings: any[]): Promise<number>;
    delete(query: string, bindings: any[]): Promise<number>;
}

export class Model {
    [x: string]: any;
    protected table: string;
    protected primaryKey: string;
    protected fillable: string[];
    protected guarded: string[];
    protected hidden: string[];
    protected timestamps: boolean;
    constructor();
    fill(attributes: Record<string, any>): void;
    static query<T extends Model>(this: new () => T, alias?: string): QueryBuilder<T>;
    static create<T extends Model>(this: new () => T, attributes: Record<string, any>): Promise<T>;
    save(): Promise<boolean>;
    getTable(): string;
    getPrimaryKey(): string;
}

export class QueryBuilder<T extends Model = Model> {
    constructor(model: T);
    as(alias: string): this;
    toSql(): string;
    create(attributes: Record<string, any>): Promise<T>;
    find(id: string | number): Promise<T | null>;
    first(): Promise<T | null>;
    get(): Promise<T[]>;
    update(attributes: Partial<T>): Promise<number>;
    delete(): Promise<number>;
    count(column?: string): Promise<number>;
    sum(column: string): Promise<number>;
    avg(column: string): Promise<number>;
    min(column: string): Promise<number>;
    max(column: string): Promise<number>;
    select(...columns: Array<string | string[]>): this;
    addSelect(...columns: Array<string | string[]>): this;
    distinct(): this;
    where(column: string, operator: QueryOperator, value: any, boolean?: QueryCondition): this;
    orWhere(column: string, operator: QueryOperator | null, value: any): this;
    andWhere(column: string, operator: QueryOperator | null, value: any): this;
    whereIn(column: string, value: any[]): this;
    whereNotIn(column: string, value: any[]): this;
    whereBetween(column: string, values: [any, any]): this;
    whereNotBetween(column: string, values: [any, any]): this;
    whereNull(column: string): this;
    whereNotNull(column: string): this;
    orderBy(column: string, direction?: "asc" | "desc"): this;
    groupBy(...columns: Array<string | string[]>): this;
    having(column: string, operator: QueryOperator, value: any, boolean?: QueryCondition): this;
    offset(value: number): this;
    limit(value: number): this;
    orderByDesc(column: string): this;
    latest(column?: string): this;
    oldest(column?: string): this;
    join(table: string, first: string, operator: QueryOperator | null, second: string, type?: JoinType): this;
    leftJoin(table: string, first: string, operator: QueryOperator | null, second: string): this;
    innerJoin(table: string, first: string, operator: QueryOperator | null, second: string): this;
}

export abstract class Migration {
    protected schema: typeof Schema;
    abstract up(): Promise<void> | void;
    abstract down(): Promise<void> | void;
}

export class Schema {
    static create(table: string, callback: (table: SchemaBlueprint) => void): Promise<void>;
    static table(table: string, callback: (table: SchemaBlueprint) => void): Promise<void>;
    static drop(table: string): Promise<void>;
    static dropIfExists(table: string): Promise<void>;
    static hasTable(table: string): Promise<boolean>;
    static hasColumn(table: string, column: string): Promise<boolean>;
    static renameColumn(table: string, from: string, to: string): Promise<void>;
    static dropColumns(table: string, columns: string[] | string): Promise<void>;
}
