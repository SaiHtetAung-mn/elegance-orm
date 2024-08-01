import Builder from "../Builder";

abstract class Grammar {
    abstract compileSelect(builder: Builder<any>): string;
    abstract compileInsert(builder: Builder<any>, columns: string[]): string;
    abstract compileUpdate(builder: Builder<any>): string;
    abstract compileDelete(builder: Builder<any>): string;

    abstract compileDistinct(builder: Builder<any>): string;
    abstract compileColumns(builder: Builder<any>): string;
    abstract compileFrom(builder: Builder<any>): string;
    abstract compileWhere(builder: Builder<any>): string;
    abstract compileOrderBy(builder: Builder<any>): string;
    abstract compileGroupBy(builder: Builder<any>): string;
    abstract compileHaving(builder: Builder<any>): string;
    abstract compileLimit(builder: Builder<any>): string;

    abstract wrap(val: string): string;
    abstract wrapTable(val: string): string;
}

export default Grammar;