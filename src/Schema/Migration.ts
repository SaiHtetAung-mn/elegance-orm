import Schema from "./Schema";

abstract class Migration {
    protected schema = Schema;

    abstract up(): Promise<void> | void;
    abstract down(): Promise<void> | void;
}

export default Migration;
