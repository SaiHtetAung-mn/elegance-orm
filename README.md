# Elegance ORM

Elegance ORM is a minimalist object relational mapper (ORM) for Node.js and TypeScript projects. In **Elegance**, each database
table is represented by a `Model` class that behaves like a plain object with dirty tracking,
fillable/guarded protection, and timestamp helpers. The fluent query builder compiles readable chain
calls into parameterized SQL while schema migrations let you describe tables in plain
language and run them through a Laravel-inspired CLI that shares the same `DataSource` configuration
as your application. Elegance currently supports:

- PostgreSQL via [`pg`](https://www.npmjs.com/package/pg)
- MySQL / MariaDB via [`mysql2`](https://www.npmjs.com/package/mysql2)
- SQLite via [`sqlite3`](https://www.npmjs.com/package/sqlite3)

---

## Installation
```bash
npm install elegance-orm@beta
```

Elegance targets Node.js 18+ and already depends on the official drivers listed above.

---

## Quick start
### 1. Initialize project
```bash
npx elegance init
```

### 2. Configure a data source
<details>
<summary>TypeScript</summary>

```ts
// src/database/dataSource.ts
import { DataSource } from "elegance-orm";

const dataSource = new DataSource({
  driver: "postgresql", // "postgresql" | "mysql" | "sqlite"
  host: "127.0.0.1",
  port: 5432,
  user: "app_user",
  password: "secret",
  database: "app_db",
  maxPoolSize: 10
});

export default dataSource;
```

</details>

<details>
<summary>JavaScript</summary>

```js
// src/database/dataSource.js
const { DataSource } = require("elegance-orm");

const dataSource = new DataSource({
  driver: "postgresql",
  host: "127.0.0.1",
  port: 5432,
  user: "app_user",
  password: "secret",
  database: "app_db",
  maxPoolSize: 10
});

module.exports = dataSource;
```

</details>

### 3. Initialize
```ts
import dataSource from "./database/dataSource";

await dataSource.initialize();
```

### 4. Define a model
<details>
<summary>TypeScript</summary>

```ts
import { Model } from "elegance-orm";

export default class User extends Model {
  protected table = "users";
  protected primaryKey = "id";
  protected fillable = ["name", "email", "status"];
  protected hidden = ["password"];
}
```

</details>

<details>
<summary>JavaScript</summary>

```js
const { Model } = require("elegance-orm");

class User extends Model {
  constructor() {
    super();
    this.table = "users";
    this.primaryKey = "id";
    this.fillable = ["name", "email", "status"];
    this.hidden = ["password"];
  }
}

module.exports = User;
```

</details>

### 5. Query with the fluent builder
<details>
<summary>TypeScript</summary>

```ts
const recent = await User
  .query()
  .select("id", "name", "email")
  .where("status", "=", "active")
  .orderByDesc("created_at")
  .limit(10)
  .get();

const user = await User.create({ name: "Ada", email: "ada@example.com", status: "active" });
user.status = "inactive";
await user.save();
```

</details>

<details>
<summary>JavaScript</summary>

```js
const recent = await User
  .query()
  .select("id", "name", "email")
  .where("status", "=", "active")
  .orderByDesc("created_at")
  .limit(10)
  .get();

const user = await User.create({ name: "Ada", email: "ada@example.com", status: "active" });
user.status = "inactive";
await user.save();
```

</details>

---

## CLI features
Elegance ships a CLI binary named `elegance` (declared in `package.json`'s `bin`). After installing
the package you can:

- run commands directly with `npx elegance <command>` (local install), or
- install globally (`npm install -g elegance-orm`) and call `elegance <command>`.

Run the `init` command once per project to scaffold `elegance.config.ts`.

| Command | Description | Handy options |
| --- | --- | --- |
| `init` | Create `elegance.config.ts` if missing. | – |
| `make:migration <name>` | Generate timestamped migration files. | `--table=users`, `--create` |
| `make:model <path>` | Scaffold a model inside the configured models directory. | supports nested paths (`Admin/User`) |
| `migrate` | Run all pending migrations (auto-creates the migrations table). | – |
| `migrate:rollback` | Roll back the latest batch. | `--step=2` |
| `migrate:refresh` | Reset the database and re-run all migrations. | – |

---

## Configuration
`elegance.config.ts` tells the CLI how to initialize your data source and where to find migrations and
models.

```ts
// elegance.config.ts
import dataSource from "./src/database/dataSource";

const config = {
  dataSource: "./src/database/dataSource",
  migrations: {
    directory: "./database/migrations",
    table: "migrations"
  },
  models: {
    directory: "./src/app/models"
  },
  language: "typescript" // or "javascript"
};

export default config;
```

| Key | Purpose |
| --- | --- |
| `dataSource` | Path (relative to the config file) that exports the `DataSource` instance. |
| `migrations.directory` | Folder containing migration files (created automatically when needed). |
| `migrations.table` | Database table used to track executed migrations (defaults to `migrations`). |
| `models.directory` | Directory where `make:model` writes files. Accepts nested folders. |
| `language` | `typescript` or `javascript`. Determines CLI templates and file extensions. |

---

## Models
Models extend the base `Model` class and behave like plain objects with guardrails.

- **Fillable** – whitelist of attributes that can be mass assigned via `Model.create` or `model.fill`.
- **Guarded** – blacklist of attributes that cannot be mass assigned. Setting `guarded = ["*"]` locks
  everything until explicitly fillable.
- **MassAssignmentException** – thrown whenever guarded attributes are filled, exposing issues fast.
- **Hidden** – attributes removed from `toJSON()` (e.g., passwords, tokens).
- **Timestamps** – `created_at` and `updated_at` automatically managed unless `timestamps = false`.
- **Dirty tracking** – only changed columns are sent during `save()`.
- **Create vs Save** – `Model.create(attributes)` constructs a new instance, fills the allowed
  attributes, inserts it into the database, and returns the hydrated model. `model.save()` persists
  the current instance: inserts when `isNew === true`, otherwise updates only the dirty attributes.

**Generate via CLI**
```bash
npx elegance make:model User
```

<details>
<summary>TypeScript</summary>

```ts
import { Model } from "elegance-orm";

export default class Article extends Model {
  protected table = "articles";
  protected fillable = ["title", "body", "status"];
  protected guarded = ["id", "user_id"];
  protected hidden = ["user_id"];
}

const article = await Article.create({ title: "Hello", body: "World", status: "draft" });
article.fill({ status: "published" });
await article.save();
```

</details>

<details>
<summary>JavaScript</summary>

```js
const { Model } = require("elegance-orm");

class Article extends Model {
  constructor() {
    super();
    this.table = "articles";
    this.fillable = ["title", "body", "status"];
    this.guarded = ["id", "user_id"];
    this.hidden = ["user_id"];
  }
}

const article = await Article.create({ title: "Hello", body: "World", status: "draft" });
article.fill({ status: "published" });
await article.save();
```

</details>

**Model helper methods**
- `Model.query(alias?)`
- `Model.create(attributes)`
- `model.save()`

---

## Query Builder
The builder provides a fluent interface for composing SQL while retaining parameter binding safety.
Inspect the generated SQL via `toSql()` to see the final statement and placeholders.

**Common entry point**
```ts
const users = await User.query().select("*").get();
```

<details>
<summary>TypeScript</summary>

```ts
const builder = User.query("u")
  .select("u.id", "u.name", "profiles.bio")
  .leftJoin("profiles", "u.id", "=", "profiles.user_id")
  .where("u.status", "=", "active")
  .whereBetween("u.created_at", ["2024-01-01", "2024-12-31"])
  .orderBy("u.created_at", "desc")
  .offset(0)
  .limit(5);

console.log(builder.toSql());
const results = await builder.get();
```

</details>

<details>
<summary>JavaScript</summary>

```js
const builder = User.query("u")
  .select("u.id", "u.name", "profiles.bio")
  .leftJoin("profiles", "u.id", "=", "profiles.user_id")
  .where("u.status", "=", "active")
  .whereBetween("u.created_at", ["2024-01-01", "2024-12-31"])
  .orderBy("u.created_at", "desc")
  .offset(0)
  .limit(5);

console.log(builder.toSql());
const results = await builder.get();
```

</details>

**Sample SQL output**
```sql
select "u"."id", "u"."name", "profiles"."bio"
from "users" as "u"
left join "profiles" on "u"."id" = "profiles"."user_id"
where "u"."status" = ?
and "u"."created_at" between ? and ?
order by "u"."created_at" desc
limit 5 offset 0
```

**Query builder methods**
- Projection: `select`, `addSelect`, `distinct`, `as`
- Filtering: `where`, `orWhere`, `andWhere`, `whereIn`, `whereNotIn`, `whereBetween`, `whereNotBetween`,
  `whereNull`, `whereNotNull`
- Joins: `join`, `leftJoin`, `innerJoin`
- Grouping/Aggregates: `groupBy`, `having`, `count`, `sum`, `avg`, `min`, `max`
- Ordering/Pagination: `orderBy`, `orderByDesc`, `latest`, `oldest`, `limit`, `offset`
- Mutations: `insertGetId`, `update`, `delete`

---

## Schema & Migrations
Migrations extend the `Migration` base class to describe tables in plain
language, which Elegance compiles to driver-specific SQL.

**Generate via CLI**
```bash
npx elegance make:migration create_users_table --table=users --create
```

#### Migration Structure
A migration class contains two methods: up and down. The up method is used to add new tables, columns, or indexes to your database, while the down method should reverse the operations performed by the up method.



<details>
<summary>TypeScript</summary>

```ts
import { Migration } from "elegance-orm";

export default class CreateUsersTable extends Migration {
  async up(): Promise<void> {
    await this.schema.create("users", table => {
      table.id();
      table.string("name");
      table.string("email").unique(["email"]);
      table.string("status").default("pending");
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await this.schema.dropIfExists("users");
  }
}
```

</details>

<details>
<summary>JavaScript</summary>

```js
const { Migration } = require("elegance-orm");

module.exports = class CreateUsersTable extends Migration {
  async up() {
    await this.schema.create("users", table => {
      table.id();
      table.string("name");
      table.string("email").unique(["email"]);
      table.string("status").default("pending");
      table.timestamps();
    });
  }

  async down() {
    await this.schema.dropIfExists("users");
  }
};
```

</details>

#### Running migration:
To run migrations

```bash
npx elegance migrate
```

#### Rolling back migration:
To roll back the latest migrations, use

```bash
npx elegance migrate:rollback
```

You can also roll back a specific "batch" of migrations
```bash
npx elegance migrate:rollback --batch=3
```

#### Roll back and migrate using a single command
This command will roll back all migrations and recreate entire database tables.

```bash
npx elegance migrate:refresh
```

**Schema builder cheat sheet**
- Column types: `id`, `uuid`, `increment`, `bigIncrement`, `string`, `text`, `longText`, `integer`,
  `bigInteger`, `smallInteger`, `float`, `double`, `boolean`, `date`, `dateTime`, `time`, `timestamp`,
  `json`, `binary`, `timestamps`
- Modifiers: `nullable`, `default`, `unsigned`, `autoIncrement`, `primary`, `unique`, `index`
- Commands: `create`, `table`, `drop`, `dropIfExists`, `dropColumns`, `renameColumn`
- Foreign keys: `foreign(column).references(...).on(...).onDelete(...).onUpdate(...)`

---

## Raw SQL & DataSource helpers
Everything in Elegance sits atop the shared `DataSource`. You can always execute raw statements or
use the lower-level helpers when needed.

**Reuse the same DataSource used in `elegance.config.ts`**
```ts
import dataSource from "./src/database/dataSource";
await dataSource.initialize();
// ...
```

<details>
<summary>TypeScript</summary>

```ts
import { DataSource } from "elegance-orm";

const dataSource = new DataSource({ /* same options as before */ });
await dataSource.initialize();

const rows = await dataSource.rawQuery(
  "select * from users where email like ?",
  ["%example.com"]
);

await dataSource.insert(
  "insert into audit_log (payload) values (?)",
  [JSON.stringify(rows)]
);

await dataSource.destroy();
```

</details>

<details>
<summary>JavaScript</summary>

```js
const { DataSource } = require("elegance-orm");

const dataSource = new DataSource({ /* options */ });
await dataSource.initialize();

const rows = await dataSource.rawQuery(
  "select * from users where email like ?",
  ["%example.com"]
);

await dataSource.insert(
  "insert into audit_log (payload) values (?)",
  [JSON.stringify(rows)]
);

await dataSource.destroy();
```

</details>

`DataSource` methods available: `initialize`, `destroy`, `rawQuery`, `select`, `insert`, `update`,
`delete`, plus driver-specific helpers exposed through the same interface.

---

ISC © Sai Htet Aung
