import { Pool, QueryResult, QueryResultRow } from "pg";
import { ConnectionOptions } from "../types";
import DbConnection from "./DbConnection";

class PostgreSqlConnection extends DbConnection {
    private pool: Pool;

    constructor(config: ConnectionOptions) {
        super(config);
        this.pool = new Pool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            max: config.maxPoolSize
        });
    }

    private normalizeQuery(sql: string): string {
        let index = 1;
        return sql.replace(/\?/g, () => `$${index++}`);
    }

    private async runQuery<T extends QueryResultRow = QueryResultRow>(sql: string, bindings: any[]): Promise<QueryResult<T>> {
        const client = await this.pool.connect();
        try {
            const text = this.normalizeQuery(sql);
            return await client.query<T>(text, bindings);
        }
        finally {
            client.release();
        }
    }

    async connect(): Promise<void> {
        const client = await this.pool.connect();
        client.release();
    }

    async disconnect(): Promise<void> {
        await this.pool.end();
    }

    async rawQuery<T>(query: string, bindings: any[] = []): Promise<T> {
        const result = await this.runQuery(query, bindings);
        return (result as unknown) as T;
    }

    async select(query: string, bindings: any[] = []): Promise<any[]> {
        const result = await this.runQuery(query, bindings);
        return result.rows;
    }

    async insert(query: string, bindings: any[] = []): Promise<number | null> {
        const result = await this.runQuery(query, bindings);
        if (result.rows.length === 0) {
            return null;
        }

        const firstRow = result.rows[0];
        const firstKey = Object.keys(firstRow)[0];
        return firstKey ? (firstRow as any)[firstKey] : null;
    }

    async update(query: string, bindings: any[]): Promise<number> {
        const result = await this.runQuery(query, bindings);
        return result.rowCount ?? 0;
    }

    async delete(query: string, bindings: any[]): Promise<number> {
        const result = await this.runQuery(query, bindings);
        return result.rowCount ?? 0;
    }
}

export default PostgreSqlConnection;
