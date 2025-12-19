# Elegance ORM
Elegance ORM is a minimalist object relational mapper (ORM) for Node.js projects. The interface emphasizes fluent, chainable methods so querying, filtering, and shaping results stays conversational rather than imperative. Migrations share that same rhythm, letting you narrate table structure and constraints in plain language while Elegance handles the SQL generation behind the scenes. In **Elegance**, each database
table is represented by a `Model` class that behaves like a plain object with dirty tracking,
fillable/guarded protection, and timestamp helpers. Elegance currently supports:

- PostgreSQL via [`pg`](https://www.npmjs.com/package/pg)
- MySQL / MariaDB via [`mysql2`](https://www.npmjs.com/package/mysql2)
- SQLite via [`sqlite3`](https://www.npmjs.com/package/sqlite3)

---

## Installation
```bash
npm install elegance-orm
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
Elegance ships a CLI binary named `elegance`. After installing
the package you can:

- run commands directly with `npx elegance <command>` (local install), or
- install globally (`npm install -g elegance-orm`) and call `elegance <command>`.

Run the `init` command once per project to scaffold `elegance.config.ts`.

| Command | Description | Handy options |
| --- | --- | --- |
| `init` | Create `elegance.config.ts` if missing. | – |
| `make:migration <name>` | Generate timestamped migration files. | `--table=users`, `--create`, `--update` |
| `make:model <path>` | Scaffold a model inside the configured models directory. | supports nested paths (`Admin/User`) |
| `migrate` | Run all pending migrations (auto-creates the migrations table). | – |
| `migrate:rollback` | Roll back the latest batch. | - |
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
In Elegance, every database table is represented by a related “Model” that handles interactions with that table. Beyond fetching data, Elegance models also let you create, modify and remove records in the table.Models extend the base `Model` class and behave like plain objects with strong guardrails so reads and writes stay predictable.
### Scaffolding & examples
**You can generate Model via cli**
```bash
npx elegance make:model Article
```

The following snippets show what a minimal `Article` model looks like in both TypeScript and JavaScript after running the generator, plus how you might create and update records using that scaffold.

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
article.status = "published"
await article.save();
```

</details>

<details>
<summary>JavaScript</summary>

```js
const { Model } = require("elegance-orm");

class Article extends Model {
  table = "articles";
  fillable = ["title", "body", "status"];
  guarded = ["id", "user_id"];
  hidden = ["user_id"];
}

const article = await Article.create({ title: "Hello", body: "World", status: "draft" });
article.status = "published";
await article.save();
```

</details>

### Core guardrails
- **Fillable** – whitelist of attributes that can be mass assigned via `Model.create`.
- **Guarded** – blacklist of attributes that cannot be mass assigned. Setting `guarded = ["*"]` locks
  everything until explicitly fillable.
- **MassAssignmentException** – thrown whenever guarded attributes are filled, exposing issues fast.
- **Hidden** – attributes removed when serialized to plain json (e.g., passwords, tokens).
- **Dirty tracking** – only changed columns are sent during `save()`.
- **Create vs Save** – `Model.create(attributes)` builds + inserts immediately, while `model.save()` handles either inserting a new row or updating only dirty fields on existing rows.

### Identity & timestamps
- `table` – the physical table name backing the model. Defaults to an empty string, so set it explicitly (for example, `"users"`).
- `primaryKey` – column used for lookups and updates. Defaults to `"id"` but can match UUIDs or other identifiers.
- `timestamps` – boolean flag that tells Elegance to manage timestamp columns automatically (default `true`).
- `CREATED_AT` / `UPDATED_AT` – column names touched when `timestamps = true`. Override these readonly properties if your schema uses different names or disable timestamping altogether with `timestamps = false`.

### Mass assignment
Mass assignment means passing a whole object of attributes into `Model.create`. It cuts boilerplate but can be dangerous when payloads come straight from request bodies. Elegance protects you by letting each model declare `fillable` (allowed) or `guarded`
(blocked) attributes. Anything outside of `fillable` causes a `MassAssignmentException`, so sensitive flags (admin booleans,
role ids, ownership columns) can’t be overwritten accidentally.

```ts
class User extends Model {
  protected table = "users";
  protected fillable = ["name", "email", "status"];
  protected guarded = ["is_admin"]; // or guarded = ["*"] to require explicit fillable
}

const payload = { name: "Rai", email: "rai@example.com", status: "active", is_admin: true };
const user = await User.create(payload); // throws because "is_admin" is not fillable

user.status = "disabled"; // respects fillable before calling save()
await user.save();
```

You can set `guarded = ["*"]` and explicitly list safe columns to make
the default stance "deny everything". This pattern keeps the model self-documenting and prevents hidden privilege escalations.

---

## Query Builder
The builder provides a fluent interface for composing SQL while retaining parameter binding safety.
Inspect the generated SQL via `toSql()` to see the final statement and placeholders.
<br/><br/>
Let's see how raw sql is generated by below code:

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
<br/>

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

### Selecting columns
Pick exactly the columns you actually care about so responses stay lean and focused on your feature.
- `select(...columns)` / `addSelect(...columns)` – project explicit columns.
- `distinct()` – deduplicate rows.
- `toSql()` – inspect the compiled SQL for debugging.

```ts
const baseQuery = User.query("u")
  .select("u.id", ["u.email", "profiles.bio"])
  .leftJoin("profiles", "u.id", "=", "profiles.user_id")
  .distinct();
console.log(baseQuery.toSql());
```

### Filtering rows
Layer whatever filters you need—equals, ranges, null checks—until the dataset matches the story you’re telling.
- `where(column, operator, value, boolean = "and")`
- `orWhere(column, operator, value)` / `andWhere(column, operator, value)`
- `whereIn(column, values)` / `whereNotIn(column, values)`
- `whereBetween(column, [from, to])` / `whereNotBetween(column, [from, to])`
- `whereNull(column)` / `whereNotNull(column)`

```ts
const active = await User.query()
  .where("status", "=", "active")
  .whereIn("role", ["admin", "editor"])
  .whereBetween("created_at", ["2024-01-01", "2024-12-31"])
  .get();
```

### Joining tables
Combine related tables in one pass so you can hydrate richer views without dropping to raw SQL.
- `join(table, first, operator, second, type = "inner")`
- `leftJoin(table, first, operator, second)`
- `innerJoin(table, first, operator, second)`

```ts
const posts = await Post.query("p")
  .leftJoin("users as u", "p.user_id", "=", "u.id")
  .select("p.id", "p.title", "u.name as author")
  .get();
```

### Grouping & aggregates
Roll rows up into grouped summaries, then run counts, sums, or averages to answer reporting questions fast.
- `groupBy(...columns)`
- `having(column, operator, value, boolean = "and")`
- `count(column = "*")`
- `sum(column)` / `avg(column)` / `min(column)` / `max(column)`

```ts
const perStatus = await Order.query()
  .select("status", "count(*) as total")
  .groupBy("status")
  .having("status", "!=", "archived")
  .get();

const revenue = await Order.query()
  .where("status", "=", "paid")
  .sum("amount");
```

### Ordering & pagination
Keep long lists predictable and easy to page through by pairing ordering helpers with `offset`/`limit`.
- `orderBy(column, direction = "asc")`
- `orderByDesc(column)`
- `latest(column = primaryKey)` / `oldest(column = primaryKey)`
- `limit(value)` / `offset(value)`

```ts
const feed = await Article.query()
  .latest("published_at")
  .offset(page * 10)
  .limit(10)
  .get();
```

### Fetching helpers
**`get()` – collection results**  
Executes the current builder and returns every matching row. Use when you expect multiple records.
```ts
const activeUsers = await User.query()
  .where("status", "active")
  .orderBy("created_at", "desc")
  .get();
```

**`first()` – single row snapshot**  
Adds `limit 1` behind the scenes and resolves with the first row or `null` if nothing matches.
```ts
const admin = await User.query()
  .where("email", "=", "admin@example.com")
  .first();
```

**`find(id)` – primary key shortcut**  
Shorthand for `where(primaryKey, "=", id).first()`. Pass the identifier and receive the matching model (or `null`) without manually building the constraint.
```ts
const order = await Order.find(42);
```

### Mutations
- `create(attributes)` – instantiate a model and persist via the builder.
- `insertGetId(attributes)` – run a raw insert and return the generated id.
- `update(attributes)` – update rows matching current constraints.
- `delete()` – delete rows matching current constraints.

---

## Schema & Migrations
Migrations act like a shared change log for your database, helping teams track, apply, and synchronize schema changes over time. Migrations extend the `Migration` base class to describe tables in plain
language which Elegance compiles to driver-specific SQL.

**Generate via CLI**
```bash
npx elegance make:migration create_users_table --table=users --create
npx elegance make:migration update_users_table --table=users --update
```

Use `--create` to scaffold a `Schema.create` migration for a new table, and `--update` to scaffold a `Schema.table` migration when you only need to modify an existing table. Pair either flag with `--table=<name>` or follow the `create_users_table` naming convention so the table can be inferred automatically.

#### Migration Structure
A migration class contains two methods: up and down. The up method is used to add new tables, columns, or indexes to your database, while the down method should reverse the operations performed by the up method.



<details>
<summary>TypeScript</summary>

```ts
import { Migration, Schema } from "elegance-orm";

export default class CreateUsersTable extends Migration {
  async up(): Promise<void> {
    await Schema.create("users", table => {
      table.id();
      table.string("name");
      table.string("email").unique(["email"]);
      table.string("status").default("pending");
      table.timestamps();
    });
  }

  async down(): Promise<void> {
    await Schema.dropIfExists("users");
  }
}
```

</details>

<details>
<summary>JavaScript</summary>

```js
const { Migration, Schema } = require("elegance-orm");

module.exports = class CreateUsersTable extends Migration {
  async up() {
    await Schema.create("users", table => {
      table.id();
      table.string("name");
      table.string("email").unique(["email"]);
      table.string("status").default("pending");
      table.timestamps();
    });
  }

  async down() {
    await Schema.dropIfExists("users");
  }
};
```

</details>

### Schema entry points
- `Schema.create(table, callback)` – define a brand new table.
- `Schema.table(table, callback)` – modify an existing table.
- `Schema.drop(table)` / `Schema.dropIfExists(table)` – remove tables.
- `Schema.hasTable(table)` / `Schema.hasColumn(table, column)` – introspection helpers for conditional migrations.
- `Schema.renameColumn(table, from, to)` / `Schema.dropColumns(table, columns)` – column maintenance.

<br/>

Example
```ts
// Create a new table
await Schema.create("users", table => {
  table.id();
  table.string("email").unique(["email"]);
  table.timestamps();
});

// Modify an existing table
await Schema.table("users", table => {
  table.string("avatar_url").nullable();
  table.dropColumns(["legacy_username"]);
});
```

### Available methods
**Identifiers & numeric helpers**
- `id(column = "id")`, `increment(column)`, `bigIncrement(column)`, `smallIncrement(column)` – auto-incrementing keys.
- `integer(column, unsigned = false, autoIncrement = false)`, `bigInteger(...)`, `smallInteger(...)` – plain numeric columns.
- `float(column, precision = 53)`, `double(column)` – floating-point storage.

**Text & structured data**
- `char(column, length = 255)`, `string(column, length = 255)`, `text(column)`, `longText(column)`
- `uuid(column)` – UUID primary or secondary keys.
- `json(column)`, `binary(column)` – structured payloads.

**Boolean & temporal helpers**
- `boolean(column)`
- `date(column)`, `dateTime(column)`, `time(column)`, `timestamp(column)`, `year(column)`
- `timestamps()` – adds nullable `created_at` / `updated_at`.

**Indexes & constraints**
- `foreign(column)` – chain `.references(column).on(table).onDelete(action).onUpdate(action)`.
- `index(columns, name?)`, `primary(columns, name?)`, `unique(columns, name?)`
- `dropPrimary(nameOrColumns)`, `dropUnique(nameOrColumns)`, `dropIndex(nameOrColumns)`, `dropForeign(nameOrColumns)`

**Table commands**
- `create()` – flag blueprint as table creation.
- `drop()`, `dropIfExists()`
- `dropColumns(columns)`
- `renameColumn(from, to)`

<br/>

Example
```ts
await Schema.table("posts", table => {
  table.string("summary", 500).nullable();
  table.boolean("is_featured").default(false);
  table.foreign("user_id").references("id").on("users").onDelete("cascade");
  table.dropIndex("posts_slug_unique");
});
```

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

#### Roll back and migrate using a single command
This command will roll back all migrations and recreate entire database tables.

```bash
npx elegance migrate:refresh
```

---

## Raw SQL & DataSource helpers
Everything in Elegance sits on the shared `DataSource`. You can always execute raw statements or
use the lower-level helpers when needed.

**Reuse the same DataSource used in `elegance.config.ts`**
```ts
import dataSource from "./src/database/dataSource";
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

#### Available Methods
- `destroy`
- `rawQuery`
- `select`
- `insert`
- `update`
- `delete`

---

ISC © Sai Htet Aung
