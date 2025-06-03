import Command from "./Command";
import { TCommandParameter } from "./types/TCommandParameter";

class ForeignCommand extends Command {
    referenceColumn: string = "";
    referenceTable: string = "";

    constructor(params: TCommandParameter) {
        super("foreign", params);
    }

    references(foreignColumn: string): this {
        this.referenceColumn = foreignColumn;

        return this;
    }

    on(referenceTable: string): this {
        this.referenceTable = referenceTable;

        return this;
    }
}

export default ForeignCommand;