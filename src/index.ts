import Connection from "./Connection/Connection";
import { Config } from "./Connection/types";
import Model from "./Model/Model";

const config: Config = {
    driver: "mysql",
    host: "localhost",
    port: 3306,
    user: "root",
    password: "admin123",
    database: "spy2024"
}

Connection.getInstance().initialize(config, () => console.log("Connected to database successfully"));

// class User extends Model {
//     protected table: string = "users";
//     protected guarded: string[] = [];
//     protected hidden: string[] = ["password"]
// }

class CodePrize extends Model {
    protected table: string = "products";
    protected guarded: string[] = [];
}

const start = Date.now();
CodePrize.query().get().then(rows => {
    const end = Date.now();
    console.log("Time taken : ", (end-start)/1000);
    console.log(rows);
    process.exit(0);
})