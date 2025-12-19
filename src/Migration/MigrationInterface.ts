interface MigrationInterface {
    up(): Promise<void> | void;
    down(): Promise<void> | void;
}

export default MigrationInterface;