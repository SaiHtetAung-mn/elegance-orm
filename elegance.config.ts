const config = {
    dataSource: __dirname + "/migrations/data-source.ts",
    migrations: {
        directory: "migrations",
        table: "migrations"
    },
    models: {
        directory: "models"
    },
    language: "javascript"
};

export default config;
