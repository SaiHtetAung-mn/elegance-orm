import Builder from "../Builder";
import Grammar from "./Grammar";

class SQLiteGrammar extends Grammar {
    compileAggregate(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileSelect(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileInsert(builder: Builder<any>, columns: string[]): string {
        throw new Error("Method not implemented.");
    }
    compileUpdate(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileDelete(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileDistinct(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileColumns(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileFrom(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileWhere(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileOrderBy(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileGroupBy(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileHaving(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileLimit(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    wrap(val: string): string {
        throw new Error("Method not implemented.");
    }
    wrapTable(val: string): string {
        throw new Error("Method not implemented.");
    }

}

export default SQLiteGrammar;