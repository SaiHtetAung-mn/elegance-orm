export type MigrationOptions = {
    directory: string;
    table?: string;
};

export type ConnectionOptions = {
    driver: "mysql" | "postgresql" | "sqlite",
    host: string,
    port: number,
    user: string,
    password: string,
    database: string,
    maxPoolSize?: number
}

export type TransactionClient = {
    rawQuery<T = any>(query: string, bindings?: any[]): Promise<T>;
    select(query: string, bindings?: any[]): Promise<any[]>;
    insert(query: string, bindings?: any[]): Promise<any>;
    update(query: string, bindings?: any[]): Promise<number>;
    delete(query: string, bindings?: any[]): Promise<number>;
}

export type TransactionCallback<T = any> = (trx: TransactionClient) => Promise<T>;
