import Command from "./Command";
import { TCommandParameter } from "./types/TCommandParameter";

class ForeignCommand extends Command {
    referenceColumn: string = "";
    referenceTable: string = "";
    onDeleteAction?: string;
    onUpdateAction?: string;

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

    onDelete(action: string): this {
        this.onDeleteAction = action;
        return this;
    }

    onUpdate(action: string): this {
        this.onUpdateAction = action;
        return this;
    }
}

export default ForeignCommand;
