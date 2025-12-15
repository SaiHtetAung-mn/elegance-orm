import sqlite3 from "sqlite3";
import { ConnectionOptions } from "../types";
import DbConnection from "./DbConnection";

class SqliteConnection extends DbConnection {
    private db: sqlite3.Database | null = null;

    constructor(config: ConnectionOptions) {
        super(config);
    }

    async connect(): Promise<void> {
        this.db = await new Promise<sqlite3.Database>((resolve, reject) => {
            const db = new sqlite3.Database(this.config.database, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(db);
                }
            });
        });
    }

    async disconnect(): Promise<void> {
        if (!this.db) return;

        await new Promise<void>((resolve, reject) => {
            this.db!.close((err: any) => (err ? reject(err) : resolve()));
        });

        this.db = null;
    }

    private ensureDb(): sqlite3.Database {
        if (!this.db) {
            throw new Error("SQLite connection has not been established");
        }

        return this.db;
    }

    async rawQuery<T>(query: string, bindings: any[] = []): Promise<T> {
        const db = this.ensureDb();
        return await new Promise<any>((resolve, reject) => {
            db.run(query, bindings, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this as sqlite3.RunResult);
                }
            });
        });
    }

    async select(query: string, bindings: any[] = []): Promise<any[]> {
        const db = this.ensureDb();
        return await new Promise<any[]>((resolve, reject) => {
            db.all(query, bindings, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async insert(query: string, bindings: any[] = []): Promise<number | null> {
        const result = await this.rawQuery<sqlite3.RunResult>(query, bindings);
        return result.lastID ?? null;
    }

    async update(query: string, bindings: any[]): Promise<number> {
        const result = await this.rawQuery<sqlite3.RunResult>(query, bindings);
        return result.changes ?? 0;
    }

    async delete(query: string, bindings: any[]): Promise<number> {
        const result = await this.rawQuery<sqlite3.RunResult>(query, bindings);
        return result.changes ?? 0;
    }
}

export default SqliteConnection;
