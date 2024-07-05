import Builder from "../Builder";
import Grammar from "./Grammar";

class MySqlGrammar extends Grammar {
    compileSelect(builder: Builder<any>): string {
        const sql = ["SELECT"];

        sql.push(this.compileDistinct(builder));
        sql.push(this.compileColumns(builder));
        sql.push(this.compileFrom(builder));
        sql.push(this.compileWhere(builder));

        return sql.join(" ").trim();
    }

    compileInsert(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }

    compileUpdate(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }
    compileDelete(builder: Builder<any>): string {
        throw new Error("Method not implemented.");
    }

    compileDistinct(builder: Builder<any>): string {
        const q = builder.getQueryObj();
        return q.wheres.length > 0 && q.distinct ? "DISTINCT" : "";
    }

    compileColumns(builder: Builder<any>): string {
        const selectQ = builder.getQueryObj().selects
            .map((column: string) => this.wrap(column))
            .join(", ");
        
        return selectQ === "" ? "*" : selectQ;
     }

    compileFrom(builder: Builder<any>): string {
        return "FROM "+this.wrapTable(builder.getQueryObj().from);
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
        return `\`${val}\``;
    }

    wrapTable(val: string): string {
        return this.wrap(val);
    }

}

export default MySqlGrammar;