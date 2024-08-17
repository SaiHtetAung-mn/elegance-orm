import Builder from "../Builder";
import operatorEnum from "../enums/operator";
import { WhereObjType } from "../types";
import Grammar from "./Grammar";

class MySqlGrammar extends Grammar {
    compileSelect(builder: Builder<any>): string {
        const sql = ["select"];
        sql.push(
            this.compileDistinct(builder),
            this.compileColumns(builder),
            this.compileAggregate(builder),
            this.compileFrom(builder),
            this.compileWhere(builder),
            this.compileGroupBy(builder),
            this.compileHaving(builder),
            this.compileOrderBy(builder),
            this.compileLimit(builder)
        );

        return sql.filter(clause => Boolean(clause)).join(" ").trim();
    }

    compileInsert(builder: Builder<any>, columns: string[]): string {
        const cols: string = columns.map(col => this.wrap(col)).join(", ");
        const values: string = Array(columns.length).fill("?").join(", ");

        const query: string[] = ["insert into"];
        query.push(
            this.wrapTable(builder.getQueryObj().from)+"("+cols+")",
            "values("+values+")"
        );

        return query.join(" ").trim();
    }

    compileUpdate(builder: Builder<any>, columns: string[]): string {
        const colValPairs: string = columns.map(col => this.wrap(col)+" = ?").join(", ");
        
        const query: string[] = ["update"];

        query.push(
            this.wrapTable(builder.getQueryObj().from),
            "set",
            colValPairs
        );

        if(builder.getQueryObj().wheres.length > 0) {
            query.push(
                this.compileWhere(builder)
            );
        }

        return query.join(" ").trim();
    }

    compileDelete(builder: Builder<any>): string {
        const query = [
            "delete", 
            "from", 
            this.wrapTable(builder.getQueryObj().from)
        ];
        
        if(builder.getQueryObj().wheres.length > 0) {
            query.push(this.compileWhere(builder));
        }

        return query.join(" ").trim();
    }

    compileDistinct(builder: Builder<any>): string {
        const q = builder.getQueryObj();
        return q.selects.length > 0 && q.distinct ? "distinct" : "";
    }

    compileAggregate(builder: Builder<any>): string {
        const q = builder.getQueryObj();
        if(!q.aggregate)
            return "";

        return q.aggregate.function+"("+q.aggregate.column+")"+" as aggregate";
    }

    compileColumns(builder: Builder<any>): string {
        if(builder.getQueryObj().aggregate)
            return "";
        
        const selectQ = builder.getQueryObj().selects
            .map((column: string) => this.wrap(column))
            .join(", ");
        
        return selectQ === "" ? "*" : selectQ;
    }

    compileFrom(builder: Builder<any>): string {
        return "from "+this.wrapTable(builder.getQueryObj().from);
    }

    compileWhere(builder: Builder<any>): string {
        const wheres = builder.getQueryObj().wheres;
        if(wheres.length === 0) {
            return "";
        }

        const whereClauses = wheres.map((where) => {
            switch(where.type) {
                case "basic": return this.whereBasic(where);
                case "in": return this.whereIn(where);
                case "between": return this.whereBetween(where);
                case "null": return this.whereNull(where);
                case "not_null": return this.whereNotNull(where);
            }
        });

        return ["where", this.removeLeadingWhereBoolean(whereClauses.join(" "))].join(" ");
    }

    protected removeLeadingWhereBoolean(whereQuery: string): string {
        // Remove leading 'and ' or 'or ' (case insensitive)
        return whereQuery.replace(/^(and |or )/i, '');
    }

    protected whereBasic(where: WhereObjType): string {
        const query = [];
        query.push(
            where.boolean, 
            this.wrap(where.column), 
            where.operator, 
            "?"
        );
        return query.join(" ");
    }

    protected whereIn(where: WhereObjType): string {
        const values = Array.isArray(where.value) ? where.value.map(() => "?").join(", ") : "?";
        const query = [];
        query.push(
            where.boolean, 
            this.wrap(where.column),
            where.operator == operatorEnum.IN ? "in" : "not in",
            "("+values+")"
        );

        return query.join(" ");
    }

    protected whereBetween(where: WhereObjType): string {
        const query = [];
        query.push(
            where.boolean,
            this.wrap(where.column),
            "between",
            "?",
            "and",
            "?"
        );

        return query.join(" ");
    }

    protected whereNotBetween(where: WhereObjType): string {
        const query = [];
        query.push(
            where.boolean,
            this.wrap(where.column),
            "not between",
            "?",
            "and",
            "?"
        );

        return query.join(" ");
    }

    protected whereNull(where: WhereObjType): string {
        const query = [];
        query.push(
            where.boolean,
            this.wrap(where.column),
            "is null"
        );

        return query.join(" ");
    }

    protected whereNotNull(where: WhereObjType): string {
        const query = [];
        query.push(
            where.boolean,
            this.wrap(where.column),
            "is not null"
        );

        return query.join(" ");
    }

    compileOrderBy(builder: Builder<any>): string {
        const orders = builder.getQueryObj().orders;
        if(orders.length === 0) 
            return "";

        const orderClauses = orders.map(order => {
            return this.wrap(order.column)+" "+order.direction;
        });

        return ["order by", orderClauses.join(", ")].join(" ");
    }

    compileGroupBy(builder: Builder<any>): string {
        const groups = builder.getQueryObj().groups;
        if(groups.length === 0) 
            return "";

        return ["group by", groups.map(column => this.wrap(column)).join(", ")].join(" ");
    }

    compileHaving(builder: Builder<any>): string {
        const havings = builder.getQueryObj().havings;
        if(havings.length === 0) {
            return "";
        }

        const whereClauses = havings.map((where) => {
            switch(where.type) {
                case "basic": return this.whereBasic(where);
                case "in": return this.whereIn(where);
                case "between": return this.whereBetween(where);
                case "null": return this.whereNull(where);
                case "not_null": return this.whereNotNull(where);
            }
        });

        return ["having", this.removeLeadingWhereBoolean(whereClauses.join(" "))].join(" ");
    }

    compileLimit(builder: Builder<any>): string {
        const limit = builder.getQueryObj().limit;
        if(limit === null) 
            return "";

        return ["limit", limit].join(" ");
    }

    wrap(val: string): string {
        return `\`${val}\``;
    }

    wrapTable(val: string): string {
        return this.wrap(val);
    }

}

export default MySqlGrammar;