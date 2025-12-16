import { ConnectionOptions } from "../types";
import DbConnection from "./DbConnection";
import mysql, { RowDataPacket, Pool, ResultSetHeader } from "mysql2/promise";

class MySqlConnection extends DbConnection {
    private pool!: Pool;

    constructor(config: ConnectionOptions) {
        super(config);
        this.createConnectionPool();
    }

    private createConnectionPool(): void {
        this.pool = mysql.createPool({
            connectionLimit: this.config.maxPoolSize ?? 10,
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database
        });
    }

    public async runQuery<T extends mysql.QueryResult>(query: string, bindings: any[]): Promise<T> {
        const con = await this.pool.getConnection();
        try {
            const [result] = await con.query<T>(query, bindings);
            return result;
        } catch (err) {
            throw err;
        } finally {
            con.release();
        }
    }

    async connect(): Promise<void> {
        const conn = await this.pool.getConnection();
        await conn.connect();
        conn.release();
        return Promise.resolve();
    }

    disconnect(): Promise<void> {
        return this.pool.end();
    }

    async rawQuery(query: string, bindings: any[] = []): Promise<ResultSetHeader> {
        return await this.runQuery<ResultSetHeader>(query, bindings);
    }

    async select(query: string, bindings: any[] = []): Promise<RowDataPacket[]> {
        const rows = await this.runQuery<RowDataPacket[]>(query, bindings);
        return rows;
    }

    async insert(query: string, bindings: any[] = []): Promise<number | null> {
        const result = await this.runQuery<ResultSetHeader>(query, bindings);
        return result.insertId ?? null;
    }

    async update(query: string, bindings: any[]): Promise<number> {
        const result = await this.runQuery<ResultSetHeader>(query, bindings);
        return result.affectedRows;
    }

    async delete(query: string, bindings: any[]): Promise<any> {
        const result = await this.runQuery<ResultSetHeader>(query, bindings);
        return result.affectedRows;
    }

}

export default MySqlConnection;
