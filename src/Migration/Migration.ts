abstract class Migration {
    abstract up(): Promise<void> | void;
    abstract down(): Promise<void> | void;
}

export default Migration;