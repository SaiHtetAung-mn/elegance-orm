import Connection from "../Connection/Connection";
import Schema from "../Schema/Schema";

type MigrationRecord = {
    migration: string;
    batch: number;
};

class MigrationRepository {
    constructor(private tableName: string = "migrations") { }

    private getConnection(): Connection {
        return Connection.getInstance();
    }

    private getQueryGrammar() {
        return this.getConnection().getQueryGrammar();
    }

    private wrapTable(): string {
        return this.getQueryGrammar().wrapTable(this.tableName);
    }

    private wrap(column: string): string {
        return this.getQueryGrammar().wrap(column);
    }

    async ensureTable(): Promise<void> {
        if (!(await Schema.hasTable(this.tableName))) {
            await Schema.create(this.tableName, table => {
                table.id();
                table.string("migration");
                table.integer("batch");
            });
        }
    }

    async getRan(): Promise<string[]> {
        const sql = `select ${this.wrap("migration")} as migration from ${this.wrapTable()} order by ${this.wrap("id")} asc`;
        const records = await this.getConnection().select(sql, []);
        return records.map(record => record["migration"]);
    }

    async getMigrationsDescending(): Promise<MigrationRecord[]> {
        const sql = `select ${this.wrap("migration")} as migration, ${this.wrap("batch")} as batch from ${this.wrapTable()} order by ${this.wrap("batch")} desc, ${this.wrap("id")} desc`;
        const records = await this.getConnection().select(sql, []);
        return records.map(record => ({
            migration: record["migration"],
            batch: typeof record["batch"] === "number" ? record["batch"] : Number(record["batch"])
        }));
    }

    async log(migration: string, batch: number): Promise<void> {
        const sql = `insert into ${this.wrapTable()} (${this.wrap("migration")}, ${this.wrap("batch")}) values (?, ?)`;
        await this.getConnection().insert(sql, [migration, batch]);
    }

    async delete(migration: string): Promise<void> {
        const sql = `delete from ${this.wrapTable()} where ${this.wrap("migration")} = ?`;
        await this.getConnection().delete(sql, [migration]);
    }

    async getNextBatchNumber(): Promise<number> {
        const sql = `select max(${this.wrap("batch")}) as batch from ${this.wrapTable()}`;
        const result = await this.getConnection().select(sql, []);
        const current = result[0]?.["batch"] ?? 0;
        return (typeof current === "number" ? current : Number(current)) + 1;
    }
}

export default MigrationRepository;
