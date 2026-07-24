# Elegance ORM

Elegance is a small, fluent ORM for Node.js. It is designed for applications that want a Laravel-like database experience without hiding the underlying SQL.

It provides:

- PostgreSQL, MySQL/MariaDB, and SQLite drivers
- fluent queries with parameter binding
- active-record models with dirty tracking and timestamps
- schema builders and migrations
- transactions that work with raw queries, builders, and models
- a CLI for initializing projects and managing migrations

Elegance supports TypeScript and JavaScript projects and requires Node.js 18 or newer.

> Elegance is currently beta software. Its API may change, and it is not yet intended for production use without your own testing and review.

## Installation

```bash
npm install elegance-orm
```

The package also provides the `elegance` command:

```bash
npx elegance <command>
```

## Quick start

### 1. Create the project files

From your project root, run:

```bash
npx elegance init
```

This creates an `elegance.config.ts` file and the directories used by the CLI.

### 2. Configure a data source

```ts
// src/database/dataSource.ts
import { DataSource } from "elegance-orm";

const dataSource = new DataSource({
  driver: "sqlite",
  host: "",
  port: 0,
  user: "",
  password: "",
  database: "./database/app.sqlite"
});

export default dataSource;
```

For PostgreSQL or MySQL, provide the corresponding host, port, credentials, and database name. See [Configuration](#configuration) for the complete option list.

### 3. Initialize the connection

```ts
import dataSource from "./database/dataSource";

await dataSource.initialize();

// Use models, Schema, or dataSource queries here.

await dataSource.destroy();
```

`DataSource` is a convenient application-facing wrapper. Internally, Elegance uses one active connection, so initialize the data source before creating builders or running schema operations.

### 4. Define a model

```ts
import { Model } from "elegance-orm";

export default class User extends Model {
  protected table = "users";
  protected primaryKey = "id";
  protected fillable = ["name", "email", "status"];
  protected hidden = ["password"];
}
```

Models should explicitly declare the attributes that may be mass-assigned through `create()` and `fill()`.

### 5. Query and save records

```ts
const activeUsers = await User.query()
  .select("id", "name", "email")
  .where("status", "=", "active")
  .orderByDesc("created_at")
  .limit(10)
  .get();

const user = await User.create({
  name: "Ada",
  email: "ada@example.com",
  status: "active"
});

user.status = "inactive";
await user.save();
```

## Models

A model represents one database table. Attribute values are exposed through the model instance, while the model keeps the original values so that `save()` can update only changed columns.

### Model properties

```ts
class Article extends Model {
  protected table = "articles";
  protected primaryKey = "id";
  protected fillable = ["title", "body", "status"];
  protected guarded = ["user_id", "is_admin"];
  protected hidden = ["user_id"];
  protected timestamps = true;
}
```

| Property | Default | Purpose |
| --- | --- | --- |
| `table` | `""` | Physical table name. |
| `primaryKey` | `"id"` | Primary-key column used by `find()` and model updates. |
| `fillable` | `["*"]` | Mass-assignment allowlist. Declare an explicit list for predictable behavior. |
| `guarded` | `[]` | Attributes excluded from mass assignment. Use `["*"]` to deny all by default. |
| `hidden` | `[]` | Attributes removed by `toJSON()`. |
| `timestamps` | `true` | Adds `created_at` and `updated_at` values during model saves. |
| `CREATED_AT` | `"created_at"` | Name of the creation timestamp column. |
| `UPDATED_AT` | `"updated_at"` | Name of the update timestamp column. |

### Creating and updating

```ts
const article = await Article.create({
  title: "Hello",
  body: "World",
  status: "draft"
});

article.status = "published";
await article.save();
```

`create()` inserts a record immediately. `save()` inserts new models and updates existing models. Existing models only write dirty attributes. Timestamp columns are managed automatically when timestamps are enabled.

### Model methods

| Method | Returns | Description |
| --- | --- | --- |
| `Model.create(attributes)` | `Promise<Model>` | Creates and inserts a model using mass-assignment rules. |
| `model.fill(attributes)` | `void` | Assigns allowed attributes. Totally guarded models throw `MassAssignmentException` for rejected input. |
| `model.save()` | `Promise<boolean>` | Inserts a new model or updates dirty attributes on an existing model. |
| `model.toJSON()` | `object` | Returns model attributes without hidden columns. |

### Mass assignment

```ts
class AdminUser extends Model {
  protected table = "users";
  protected fillable = ["name", "email"];
  protected guarded = ["is_admin"];
}

await AdminUser.create({
  name: "Ada",
  email: "ada@example.com",
  is_admin: true // throws MassAssignmentException
});
```

For untrusted input, keep `fillable` explicit and use `guarded = ["*"]` when you want to deny all attributes unless they are listed in `fillable`.

`query().insert()` is intended for bulk or trusted data imports. It bypasses model fillable checks and does not add model timestamps.

## Query builder

Call `Model.query()` to create a builder. Builders are fluent and use bound values for conditions and mutations.

Use `toSql()` when you want to inspect the generated SQL:

```ts
const query = User.query("u")
  .select("u.id", "u.name", "profiles.bio")
  .leftJoin("profiles", "u.id", "=", "profiles.user_id")
  .where("u.status", "=", "active")
  .whereBetween("u.created_at", ["2024-01-01", "2024-12-31"])
  .orderBy("u.created_at", "desc")
  .limit(5)
  .offset(0);

console.log(query.toSql());
```

The SQL uses `?` placeholders. PostgreSQL converts those placeholders to its numbered parameter format before execution.

### Selecting

```ts
await User.query()
  .select("id", "name")
  .addSelect("email")
  .distinct()
  .get();
```

| Method | Description |
| --- | --- |
| `select(...columns)` | Adds columns to the selection list. |
| `addSelect(...columns)` | Adds columns to the selection list. |
| `distinct()` | Adds `distinct` to the select statement. |

### Filtering

```ts
const users = await User.query()
  .where("status", "=", "active")
  .whereIn("role", ["admin", "editor"])
  .whereBetween("created_at", ["2024-01-01", "2024-12-31"])
  .whereNull("deleted_at")
  .get();
```

| Method | Description |
| --- | --- |
| `where(column, operator, value)` | Adds an `and` basic condition. |
| `andWhere(column, operator, value)` | Adds an `and` basic condition. A `null` operator is treated as `=`. |
| `orWhere(column, operator, value)` | Adds an `or` basic condition. A `null` operator is treated as `=`. |
| `whereIn(column, values)` | Matches one of a non-empty list of values. |
| `whereNotIn(column, values)` | Excludes a non-empty list of values. |
| `whereBetween(column, [from, to])` | Matches an inclusive range. |
| `whereNotBetween(column, [from, to])` | Excludes an inclusive range. |
| `whereNull(column)` | Matches `NULL`. |
| `whereNotNull(column)` | Excludes `NULL`. |

### Joins

```ts
const posts = await Post.query("p")
  .select("p.id", "p.title", "u.name as author")
  .leftJoin("users as u", "p.user_id", "=", "u.id")
  .get();
```

| Method | Description |
| --- | --- |
| `join(table, first, operator, second)` | Adds an inner join. |
| `innerJoin(table, first, operator, second)` | Alias for an inner join. |
| `leftJoin(table, first, operator, second)` | Adds a left join. |

Table aliases and qualified column names are supported.

### Grouping and aggregates

```ts
const count = await User.query()
  .where("status", "=", "active")
  .count();

const totalVisits = await User.query().sum("visits");

const summaries = await User.query()
  .select("status")
  .groupBy("status")
  .having("status", "!=", "archived")
  .get();
```

| Method | Returns | Description |
| --- | --- | --- |
| `count(column = "*")` | `Promise<number>` | Counts matching rows. |
| `sum(column)` | `Promise<number>` | Sums a column. |
| `avg(column)` | `Promise<number>` | Calculates the average. |
| `min(column)` | `Promise<number>` | Returns the minimum value. |
| `max(column)` | `Promise<number>` | Returns the maximum value. |

### Ordering and pagination

```ts
const page = await Article.query()
  .latest("published_at")
  .limit(10)
  .offset(20)
  .get();
```

| Method | Description |
| --- | --- |
| `orderBy(column, direction = "asc")` | Adds ascending or descending ordering. |
| `orderByDesc(column)` | Adds descending ordering. |
| `latest(column = primaryKey)` | Orders by a column descending. |
| `oldest(column = primaryKey)` | Orders by a column ascending. |
| `limit(value)` | Limits the number of rows. |
| `offset(value)` | Skips rows before returning results. |

### Fetching records

| Method | Returns | Description |
| --- | --- | --- |
| `get()` | `Promise<Model[]>` | Returns all matching models. |
| `first()` | `Promise<Model \| null>` | Returns the first matching model. |
| `find(id)` | `Promise<Model \| null>` | Looks up a model by its primary key. |

### Mutating records

```ts
await User.query().insert([
  { name: "Grace", email: "grace@example.com" },
  { name: "Katherine", email: "katherine@example.com" }
]);

await User.query()
  .where("status", "=", "draft")
  .update({ status: "published" });

await User.query()
  .where("id", "=", 10)
  .delete();
```

| Method | Returns | Description |
| --- | --- | --- |
| `insert(records)` | `Promise<void>` | Performs a bulk insert. Bypasses fillable checks and model timestamps. |
| `insertGetId(attributes)` | `Promise<number \| null>` | Inserts one row and returns its generated key when supported by the driver. |
| `update(attributes)` | `Promise<number>` | Updates rows matching the current constraints. |
| `delete()` | `Promise<number>` | Deletes rows matching the current constraints. |
| `toSql()` | `string` | Returns the compiled select SQL without executing it. |

## Schema builder

Schema operations are available through the static `Schema` facade:

```ts
import { Schema } from "elegance-orm";

await Schema.create("users", table => {
  table.id();
  table.string("name");
  table.string("email").unique();
  table.string("status").default("pending");
  table.timestamps();
});
```

To modify an existing table:

```ts
await Schema.table("users", table => {
  table.string("display_name").nullable();
  table.index(["display_name"]);
});
```

### Schema methods

| Method | Returns | Description |
| --- | --- | --- |
| `Schema.create(table, callback)` | `Promise<void>` | Creates a table from a blueprint. |
| `Schema.table(table, callback)` | `Promise<void>` | Alters an existing table from a blueprint. |
| `Schema.drop(table)` | `Promise<void>` | Drops a table. |
| `Schema.dropIfExists(table)` | `Promise<void>` | Drops a table if it exists. |
| `Schema.renameColumn(table, from, to)` | `Promise<void>` | Renames a column. |
| `Schema.dropColumns(table, columns)` | `Promise<void>` | Removes one or more columns. |
| `Schema.hasTable(table)` | `Promise<boolean>` | Checks whether a table exists. |
| `Schema.hasColumn(table, column)` | `Promise<boolean>` | Checks whether a column exists. |

### Column methods

| Group | Methods |
| --- | --- |
| IDs | `id`, `increment`, `bigIncrement`, `smallIncrement` |
| Integers | `integer`, `bigInteger`, `smallInteger` |
| Text | `char`, `string`, `text`, `longText` |
| Date and time | `date`, `dateTime`, `time`, `timestamp`, `year`, `timestamps` |
| Other | `uuid`, `json`, `binary`, `boolean`, `float`, `double` |

Column definitions support `nullable()`, `default()`, `unsigned()`, `useCurrent()`, `useCurrentOnUpdate()`, `onUpdate()`, `after()`, `first()`, `comments()`, `index()`, `primary()`, and `unique()`.

### Indexes and foreign keys

```ts
await Schema.create("posts", table => {
  table.id();
  table.integer("author_id");
  table.string("title");

  table.foreign("author_id")
    .references("id")
    .on("users")
    .onDelete("cascade")
    .onUpdate("cascade");
});
```

Blueprint methods for indexes and constraints are `primary()`, `unique()`, `index()`, `dropPrimary()`, `dropUnique()`, `dropIndex()`, and `dropForeign()`.

The generated SQL is driver-specific. Some schema features, especially table alterations and foreign-key changes, have different capabilities across SQLite, PostgreSQL, and MySQL.

## Migrations

A migration is a versioned pair of `up()` and `down()` methods:

```ts
import { Migration, Schema } from "elegance-orm";

export default class CreateUsersTable extends Migration {
  async up() {
    await Schema.create("users", table => {
      table.id();
      table.string("name");
      table.string("email").unique();
      table.timestamps();
    });
  }

  async down() {
    await Schema.dropIfExists("users");
  }
}
```

Generate migration files with:

```bash
npx elegance make:migration create_users_table --create
npx elegance make:migration add_status_to_users_table --update
```

You can provide a table explicitly with `--table=users`. The migration repository records executed files in the configured migrations table.

Run migrations with:

```bash
npx elegance migrate
npx elegance migrate:rollback
npx elegance migrate:rollback --step=2
npx elegance migrate:refresh
```

`migrate:rollback` rolls back the latest batch by default. `migrate:refresh` rolls back recorded migrations and runs them again.

## Transactions

Use `DataSource.transaction()` when several operations must succeed or fail together:

```ts
await dataSource.transaction(async trx => {
  await trx.insert(
    "insert into orders (user_id, total) values (?, ?)",
    [userId, total]
  );

  await User.query()
    .where("id", "=", userId)
    .update({ last_order_total: total } as any);

  await User.create({
    name: "Transaction User",
    email: "tx@example.com"
  });
});
```

Raw queries, builders, and models called inside the callback automatically use the active transaction. If the callback throws, the transaction is rolled back. Nested transactions reuse the current transaction; savepoints are not currently provided.

The transaction callback also receives a low-level client with `rawQuery`, `select`, `insert`, `update`, and `delete` methods.

## Raw database access

```ts
const rows = await dataSource.select(
  "select * from users where email like ?",
  ["%example.com"]
);

await dataSource.insert(
  "insert into audit_log (payload) values (?)",
  [JSON.stringify(rows)]
);
```

### DataSource methods

| Method | Returns | Description |
| --- | --- | --- |
| `initialize(callback?)` | `Promise<void>` | Opens the configured connection. |
| `destroy()` | `Promise<void>` | Closes the connection. |
| `isInitialized()` | `boolean` | Reports whether the connection is initialized. |
| `rawQuery(query, bindings?)` | `Promise<any>` | Executes a raw statement. |
| `select(query, bindings?)` | `Promise<any[]>` | Executes a query and returns rows. |
| `insert(query, bindings?)` | `Promise<any>` | Executes an insert and returns the driver result or generated ID. |
| `update(query, bindings)` | `Promise<number>` | Executes an update and returns affected rows. |
| `delete(query, bindings)` | `Promise<number>` | Executes a delete and returns affected rows. |
| `transaction(callback)` | `Promise<T>` | Runs the callback inside a transaction. |

## CLI

| Command | Purpose | Options |
| --- | --- | --- |
| `init` | Create the project configuration and directories. | — |
| `make:migration <name>` | Generate a timestamped migration. | `--table`, `--create`, `--update` |
| `make:model <path>` | Generate a model file. | Nested paths are supported. |
| `migrate` | Run pending migrations. | — |
| `migrate:rollback` | Roll back the latest migration batch. | `--step=2` |
| `migrate:refresh` | Roll back and rerun migrations. | — |

## Configuration

The CLI looks for one of these files in the project root:

```text
elegance.config.ts
elegance.config.js
elegance.config.cjs
elegance.config.mjs
elegance.config.json
```

Example:

```ts
const config = {
  dataSource: "./src/database/dataSource",
  migrations: {
    directory: "./database/migrations",
    table: "migrations"
  },
  models: {
    directory: "./src/app/models"
  },
  language: "typescript"
};

export default config;
```

| Option | Description |
| --- | --- |
| `dataSource` | Module path exporting a `DataSource` instance. |
| `migrations.directory` | Directory containing migration files. |
| `migrations.table` | Table used to record executed migrations. Defaults to `migrations`. |
| `models.directory` | Destination directory for generated models. |
| `language` | `typescript` or `javascript`; controls generated files. |

### Data source options

```ts
type DataSourceOptions = {
  driver: "mysql" | "postgresql" | "sqlite";
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  maxPoolSize?: number;
};
```

For SQLite, `host`, `port`, `user`, and `password` are unused; `database` is the path to the SQLite file.
