import DbConnection from "./DbConnection";

class SqliteConnection extends DbConnection {
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

}

export default SqliteConnection;