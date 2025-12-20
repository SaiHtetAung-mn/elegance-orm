import Builder from "../Builder";

abstract class Grammar {
    abstract compileSelect(builder: Builder<any>): string;
    abstract compileInsert(builder: Builder<any>, columns: string[], rowsCount?: number): string;
    abstract compileUpdate(builder: Builder<any>, columns: string[]): string;
    abstract compileDelete(builder: Builder<any>): string;

    abstract compileAggregate(builder: Builder<any>): string;

    abstract compileDistinct(builder: Builder<any>): string;
    abstract compileColumns(builder: Builder<any>): string;
    abstract compileFrom(builder: Builder<any>): string;
    abstract compileWhere(builder: Builder<any>): string;
    abstract compileOrderBy(builder: Builder<any>): string;
    abstract compileGroupBy(builder: Builder<any>): string;
    abstract compileHaving(builder: Builder<any>): string;
    abstract compileLimit(builder: Builder<any>): string;
    compileJoins(builder: Builder<any>): string {
        const joins = builder.getQueryObj().joins;
        if (!joins || joins.length === 0)
            return "";

        const clauses = joins.map(join => {
            const joinType = join.type === "left" ? "left" : "inner";
            const table = this.wrapTable(join.table);
            const onSql = join.clauses.map((clause, index) => {
                const boolean = index === 0 ? "" : `${clause.boolean} `;
                return `${boolean}${this.wrap(clause.first)} ${clause.operator} ${this.wrap(clause.second)}`;
            }).join(" ");

            return `${joinType} join ${table} on ${onSql}`;
        });

        return clauses.join(" ");
    }

    abstract wrap(val: string): string;
    abstract wrapTable(val: string): string;
}

export default Grammar;
