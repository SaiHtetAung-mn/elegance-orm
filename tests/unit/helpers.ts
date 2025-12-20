import { Model } from "../../src";
import Connection from "../../src/connection/Connection";
import SQLiteQueryGrammar from "../../src/query/grammars/SQLiteGrammar";
import Processor from "../../src/query/processors/Processor";
import SQLiteSchemaGrammar from "../../src/schema/grammars/SQLiteGrammar";
import Command, { CommandArguments } from "../../src/console/Command";

export class QueryStubProcessor implements Processor {
    records: Record<string, any>[] = [];
    insertId = 10;
    updateCount = 1;
    deleteCount = 1;

    lastSelect?: { query: string; bindings: any[] };
    lastInsert?: { query: string; bindings: any[] };
    lastUpdate?: { query: string; bindings: any[] };
    lastDelete?: { query: string; bindings: any[] };

    async processSelect<T extends Model>(query: string, bindings: any[], ModelClass: any): Promise<T[]> {
        this.lastSelect = { query, bindings };
        return ModelClass.hydrate(this.records);
    }

    async processInsertGetId(query: string, values: any[]): Promise<number | null> {
        this.lastInsert = { query, bindings: values };
        return this.insertId;
    }

    async processUpdate(query: string, bindings: any[]): Promise<number> {
        this.lastUpdate = { query, bindings };
        return this.updateCount;
    }

    async processDelete(query: string, bindings: any[]): Promise<number> {
        this.lastDelete = { query, bindings };
        return this.deleteCount;
    }
}

export class QueryConnectionStub {
    grammar = new SQLiteQueryGrammar();
    processor = new QueryStubProcessor();
    aggregateValue = 0;
    lastAggregate?: { query: string; bindings: any[] };
    lastRaw?: { query: string; bindings: any[] };

    getQueryGrammar() {
        return this.grammar;
    }

    getQueryProcessor() {
        return this.processor;
    }

    async select(query: string, bindings: any[]): Promise<any[]> {
        this.lastAggregate = { query, bindings };
        return [{ aggregate: this.aggregateValue }];
    }

    async insert(): Promise<number | null> {
        return null;
    }

    async update(): Promise<number> {
        return 0;
    }

    async delete(): Promise<number> {
        return 0;
    }

    async rawQuery(query: string, bindings: any[]): Promise<void> {
        this.lastRaw = { query, bindings };
    }
}

export class SchemaConnectionStub {
    grammar = new SQLiteSchemaGrammar();
    statements: string[] = [];
    selectResults: any[][] = [];
    lastSelect?: { sql: string; bindings: any[] };

    getSchemaGrammar() {
        return this.grammar;
    }

    async rawQuery(sql: string): Promise<void> {
        this.statements.push(sql);
    }

    async select(sql: string, bindings: any[]): Promise<any[]> {
        this.lastSelect = { sql, bindings };
        return this.selectResults.shift() ?? [];
    }
}

export class FakeCommand extends Command {
    signature: string;
    description: string;
    initializeCalls = 0;
    teardownCalls = 0;
    handledArgs: CommandArguments | null = null;
    shouldThrow: boolean;

    constructor(signature: string, description: string = "", shouldThrow = false) {
        super();
        this.signature = signature;
        this.description = description || `command:${signature}`;
        this.shouldThrow = shouldThrow;
    }

    async initialize(): Promise<void> {
        this.initializeCalls++;
    }

    async teardown(): Promise<void> {
        this.teardownCalls++;
    }

    async handle(args: CommandArguments): Promise<void> {
        this.handledArgs = args;
        if (this.shouldThrow) {
            throw new Error("handle error");
        }
    }
}
