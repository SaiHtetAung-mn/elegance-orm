import Builder from "../Builder";
import operatorEnum from "../enums/operator";
import { WhereObjType } from "../types";
import Grammar from "./Grammar";

class PostgreSqlGrammar extends Grammar {
    compileSelect(builder: Builder<any>): string {
        const sql = ["select"];
        sql.push(
            this.compileDistinct(builder),
            this.compileColumns(builder),
            this.compileAggregate(builder),
            this.compileFrom(builder),
            this.compileJoins(builder),
            this.compileWhere(builder),
            this.compileGroupBy(builder),
            this.compileHaving(builder),
            this.compileOrderBy(builder),
            this.compileLimit(builder)
        );

        return sql.filter(Boolean).join(" ").trim();
    }

    compileInsert(builder: Builder<any>, columns: string[]): string {
        const cols = columns.map(col => this.wrap(col)).join(", ");
        const values = Array(columns.length).fill("?").join(", ");
        const query: string[] = ["insert into"];
        query.push(
            `${this.wrapTable(builder.getQueryObj().from)} (${cols})`,
            `values (${values})`,
            `returning ${this.wrap(builder.getQueryObj().primaryKey)}`
        );

        return query.join(" ");
    }

    compileUpdate(builder: Builder<any>, columns: string[]): string {
        const assignments = columns.map(col => `${this.wrap(col)} = ?`).join(", ");
        const query = [
            "update",
            this.wrapTable(builder.getQueryObj().from),
            "set",
            assignments
        ];

        if (builder.getQueryObj().wheres.length > 0) {
            query.push(this.compileWhere(builder));
        }

        return query.join(" ").trim();
    }

    compileDelete(builder: Builder<any>): string {
        const query = [
            "delete from",
            this.wrapTable(builder.getQueryObj().from)
        ];

        if (builder.getQueryObj().wheres.length > 0) {
            query.push(this.compileWhere(builder));
        }

        return query.join(" ").trim();
    }

    compileAggregate(builder: Builder<any>): string {
        const q = builder.getQueryObj();
        if (!q.aggregate)
            return "";

        return `${q.aggregate.function}(${q.aggregate.column}) as aggregate`;
    }

    compileDistinct(builder: Builder<any>): string {
        const q = builder.getQueryObj();
        return q.selects.length > 0 && q.distinct ? "distinct" : "";
    }

    compileColumns(builder: Builder<any>): string {
        if (builder.getQueryObj().aggregate)
            return "";

        const selectQ = builder.getQueryObj().selects
            .map(column => this.wrap(column))
            .join(", ");

        return selectQ === "" ? "*" : selectQ;
    }

    compileFrom(builder: Builder<any>): string {
        return `from ${this.wrapTable(builder.getQueryObj().from)}`;
    }

    compileWhere(builder: Builder<any>): string {
        const wheres = builder.getQueryObj().wheres;
        if (wheres.length === 0)
            return "";

        const clauses = wheres.map(where => this.compileWhereComponent(where));
        return ["where", this.removeLeadingBoolean(clauses.join(" "))].join(" ");
    }

    protected compileWhereComponent(where: WhereObjType): string {
        switch (where.type) {
            case "basic":
                return `${where.boolean} ${this.wrap(where.column)} ${where.operator} ?`;
            case "in":
                return this.whereIn(where);
            case "between":
                return `${where.boolean} ${this.wrap(where.column)} between ? and ?`;
            case "not_between":
                return `${where.boolean} ${this.wrap(where.column)} not between ? and ?`;
            case "null":
                return `${where.boolean} ${this.wrap(where.column)} is null`;
            case "not_null":
                return `${where.boolean} ${this.wrap(where.column)} is not null`;
            default:
                throw new Error(`Unsupported where type: ${where.type}`);
        }
    }

    protected whereIn(where: WhereObjType): string {
        const values = Array.isArray(where.value) ? where.value.map(() => "?").join(", ") : "?";
        const operator = where.operator === operatorEnum.IN ? "in" : "not in";
        return `${where.boolean} ${this.wrap(where.column)} ${operator} (${values})`;
    }

    compileOrderBy(builder: Builder<any>): string {
        const orders = builder.getQueryObj().orders;
        if (orders.length === 0)
            return "";

        const clauses = orders.map(order => `${this.wrap(order.column)} ${order.direction}`);
        return `order by ${clauses.join(", ")}`;
    }

    compileGroupBy(builder: Builder<any>): string {
        const groups = builder.getQueryObj().groups;
        if (groups.length === 0)
            return "";

        return `group by ${groups.map(column => this.wrap(column)).join(", ")}`;
    }

    compileHaving(builder: Builder<any>): string {
        const havings = builder.getQueryObj().havings;
        if (havings.length === 0)
            return "";

        const clauses = havings.map(where => this.compileWhereComponent(where));
        return `having ${this.removeLeadingBoolean(clauses.join(" "))}`;
    }

    compileLimit(builder: Builder<any>): string {
        const { limit, offset } = builder.getQueryObj();
        if (limit === null && offset === null)
            return "";

        if (limit === null && offset !== null)
            return `offset ${offset}`;

        if (offset !== null)
            return `limit ${limit} offset ${offset}`;

        return `limit ${limit}`;
    }

    protected removeLeadingBoolean(clause: string): string {
        return clause.replace(/^(and |or )/i, "");
    }

    wrap(val: string): string {
        if (val === "*") {
            return val;
        }

        const lower = val.toLowerCase();
        if (lower.includes(" as ")) {
            const [before, after] = val.split(/\s+as\s+/i);
            return `${this.wrap(before)} as ${this.wrap(after)}`;
        }

        return val
            .split(".")
            .map(segment => segment === "*" ? segment : `"${segment.replace(/"/g, '""')}"`)
            .join(".");
    }

    wrapTable(val: string): string {
        return this.wrap(val);
    }
}

export default PostgreSqlGrammar;
