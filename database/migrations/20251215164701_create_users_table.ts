import Migration from "../../src/Schema/Migration";

export default class CreateUsersTable extends Migration {
    async up(): Promise<void> {
        await this.schema.create("users", table => {
            table.id();
            table.timestamps();
        });
    }

    async down(): Promise<void> {
        await this.schema.dropIfExists("users");
    }
}
