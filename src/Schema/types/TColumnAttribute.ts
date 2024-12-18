export type TColumnAttribute = {
    primary?: boolean,
    unique?: boolean,
    nullable?: boolean,
    default?: any,
    unsigned?: boolean,
    autoIncrement?: boolean,
    length?: number,

    // For floating point
    precision?: number

    // Pisition
    after?: string,
    first?: boolean,

    comment?: string,

    index?: boolean
}