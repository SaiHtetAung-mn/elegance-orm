import DbConnection from "./DbConnection";

class SqliteConnection extends DbConnection {
    rawQuery<T>(query: string, bindings: any[]): Promise<T> {
        throw new Error("Method not implemented.");
    }
    connect(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    disconnect(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    select(query: string, bindings: []): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    insert(query: string, bindings: []): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    update(query: string, bindings: []): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    delete(query: string, bindings: any[]): Promise<any> {
        throw new Error("Method not implemented.");
    }
}

export default SqliteConnection;