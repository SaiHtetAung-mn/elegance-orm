import { TCommandParameter } from "./types/TCommandParameter";

class Command {
    name: TCommandName;
    columns: string[] = [];
    shouldBeSkipped: boolean = false;
    indexName: string = "";

    constructor(name: TCommandName, params: TCommandParameter = {}) {
        this.name = name;

        params.columns && (this.columns = params.columns);
    }
}

export default Command;