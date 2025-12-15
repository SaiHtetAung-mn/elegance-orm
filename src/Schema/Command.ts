import { TCommandName } from "./types/TCommandName";
import { TCommandParameter } from "./types/TCommandParameter";

class Command {
    name: TCommandName;
    columns: string[] = [];
    shouldBeSkipped: boolean = false;
    indexName: string = "";
    from?: string;
    to?: string;
    table?: string;

    constructor(name: TCommandName, params: TCommandParameter = {}) {
        this.name = name;

        params.columns && (this.columns = params.columns);
        params.indexName && (this.indexName = params.indexName);
        params.from && (this.from = params.from);
        params.to && (this.to = params.to);
        params.table && (this.table = params.table);
    }
}

export default Command;
