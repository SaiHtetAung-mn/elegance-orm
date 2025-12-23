import { ConnectionOptions, TransactionCallback, TransactionClient } from "../types";
import DbConnection from "./DbConnection";
import mysql, { RowDataPacket, Pool, PoolConnection, ResultSetHeader } from "mysql2/promise";

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

    public async runQuery<T extends mysql.QueryResult>(query: string, bindings: any[], existingConnection?: PoolConnection): Promise<T> {
        const con = existingConnection ?? await this.pool.getConnection();
        try {
            const [result] = await con.query<T>(query, bindings);
            return result;
        } catch (err) {
            throw err;
        } finally {
            if (!existingConnection) {
                con.release();
            }
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

    async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
        const connection = await this.pool.getConnection();
        const trxClient = this.createTransactionClient(connection);

        try {
            await connection.beginTransaction();
            const result = await callback(trxClient);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    private createTransactionClient(connection: PoolConnection): TransactionClient {
        return {
            rawQuery: async <T = ResultSetHeader>(query: string, bindings: any[] = []) => {
                const result = await this.runQuery<mysql.QueryResult>(query, bindings, connection);
                return result as T;
            },
            select: async (query: string, bindings: any[] = []) => {
                return await this.runQuery<RowDataPacket[]>(query, bindings, connection);
            },
            insert: async (query: string, bindings: any[] = []) => {
                const result = await this.runQuery<ResultSetHeader>(query, bindings, connection);
                return result.insertId ?? null;
            },
            update: async (query: string, bindings: any[] = []) => {
                const result = await this.runQuery<ResultSetHeader>(query, bindings, connection);
                return result.affectedRows;
            },
            delete: async (query: string, bindings: any[] = []) => {
                const result = await this.runQuery<ResultSetHeader>(query, bindings, connection);
                return result.affectedRows;
            }
        };
    }

}

export default MySqlConnection;
