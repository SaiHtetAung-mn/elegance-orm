import { columnType } from "./constants/ColumnType";
import { TColumnAttribute } from "./types/TColumnAttribute";

class ColumnDefinition {
    private attributes: TColumnAttribute;
    private column: string;
    private type: typeof columnType[keyof typeof columnType];

    constructor(
        column: string,
        type: typeof columnType[keyof typeof columnType],
        attrs: TColumnAttribute = {}
    ) {
        this.column = column;
        this.type = type;
        this.attributes = attrs;
    }

    private setAttribute<K extends keyof TColumnAttribute>(
        attribute: K,
        value: TColumnAttribute[K]
    ): void {
        this.attributes[attribute] = value;
    }

    public getAttribute(name: keyof TColumnAttribute) {
        return this.attributes[name];
    }

    public getType() {
        return this.type;
    }

    public getColumn() {
        return this.column;
    }

    /***  General methods */

    primary(value: boolean = true): this {
        this.setAttribute("primary", value);

        return this;
    }

    unique(value: boolean = true): this {
        this.setAttribute("unique", value);

        return this;
    }

    nullable(value: boolean = true): this {
        this.setAttribute("nullable", value);

        return this;
    }

    default(value: string|number|boolean): this {
        this.setAttribute("default", value);

        return this;
    }

    onUpdate(value: string|number|boolean): this {
        this.setAttribute("onUpdate", value);

        return this;
    }

    unsigned(value: boolean = true): this {
        this.setAttribute("unsigned", value);

        return this;
    }

    useCurrent(value: boolean = true): this {
        this.setAttribute("useCurrent", value);

        return this;
    }

    useCurrentOnUpdate(value: boolean = true): this {
        this.setAttribute("useCurrentOnUpdate", value);

        return this;
    }

    /***  Column positioning methods */

    after(column: string): this {
        this.setAttribute("after", column);

        return this;
    }

    first(): this {
        this.setAttribute("first", true);

        return this;
    }

    /***  Comments */
    comments(value: string): this {
        this.setAttribute("comment", value);

        return this;
    }

     /***  Index */
     index(): this {
        this.setAttribute("index", true);

        return this;
     }
}

export default ColumnDefinition;