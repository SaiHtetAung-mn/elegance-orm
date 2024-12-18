import { Pool, ResultSetHeader } from "mysql2/promise";
import { Config } from "../types";
import DbConnection from "./DbConnection";
import mysql, { RowDataPacket } from "mysql2/promise";

class MySqlConnection extends DbConnection {
    private pool!: Pool;

    constructor(config: Config) {
        super(config);
        this.createConnectionPool();
    }

    private createConnectionPool(): void {
        this.pool = mysql.createPool({
            connectionLimit: 10,
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database
        });
    }

    private async runQuery<T extends mysql.QueryResult>(query: string, bindings: any[]): Promise<T | undefined> {
        const con = await this.pool.getConnection();
        try {
            const [result] = await con.query<T>(query, bindings);
            return result;
        } catch (err: any) {
            Promise.reject(err);
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
        return Promise.resolve();
    }

    async select(query: string, bindings: []): Promise<any[]> {
        const rows = await this.runQuery<RowDataPacket[]>(query, bindings);
        return rows ?? [];
    }

    async insert(query: string, bindings: []): Promise<number | null> {
        const result = await this.runQuery<ResultSetHeader>(query, bindings);
        if (!result) return null;

        return result.insertId;
    }

    async update(query: string, bindings: any[]): Promise<number> {
        const result = await this.runQuery<ResultSetHeader>(query, bindings);
        if (!result) return 0;

        return result.affectedRows;
    }

    async delete(query: string, bindings: any[]): Promise<any> {
        const result = await this.runQuery<ResultSetHeader>(query, bindings);
        if (!result) return 0;

        return result.affectedRows;
    }

}

export default MySqlConnection;