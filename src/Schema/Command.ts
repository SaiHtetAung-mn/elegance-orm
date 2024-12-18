import { TCommandParameter } from "./types/TCommandParameter";

class Command {
    name: string;
    columns: string[] = [];

    constructor(name: string, params: TCommandParameter = {}) {
        this.name = name;

        params.columns && (this.columns = params.columns);
    }
}

export default Command;