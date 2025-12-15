export type ConnectionOptions = {
    driver: "mysql" | "postgresql" | "sqlite",
    host: string,
    port: number,
    user: string,
    password: string,
    database: string
}