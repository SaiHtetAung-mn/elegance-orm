import Connection from "./Connection/Connection";
import { Config } from "./Connection/types";
import Model from "./Model/Model";

const config: Config = {
    driver: "mysql",
    host: "localhost",
    port: 3306,
    user: "root",
    password: "admin123",
    database: "orm_test"
}

Connection.getInstance().initialize(config, () => console.log("Connected to database successfully"));

class User extends Model {
    protected table: string = "users";
    protected guarded: string[] = [];
    protected hidden: string[] = ["password"]
}

// User
//     .create({"name": "Test", "email": "test@gmail.com", "password": "testpassword"})
//     .then(data => { 
//         const user = data;
//         user.password = "lee";
//         console.log(user);
//         process.exit(1);
//     });

User.query()
    // .where("email", "=", "test@gmail.com")
    // .find(10)
    .first()
    .then((user) => {
        console.log(((user)));
        process.exit(0);
    });