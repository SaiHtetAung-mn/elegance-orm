export type ConnectionConfig = {
    host: string,
    port: number,
    user: string,
    password: string,
    database: string
}

export type Config = {
    driver: "mysql" | "postgresql" | "sqlite",
    host: string,
    port: number,
    user: string,
    password: string,
    database: string
}