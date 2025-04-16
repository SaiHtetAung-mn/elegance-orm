export type TColumnAttribute = {
    primary?: boolean,
    unique?: boolean,
    nullable?: boolean,
    default?: any,
    onUpdate?: any,
    unsigned?: boolean,
    autoIncrement?: boolean,
    length?: number,

    // For floating point
    precision?: number

    // Position
    after?: string,
    first?: boolean,

    comment?: string,

    index?: boolean,

    // For timestamps
    useCurrent?: boolean,
    useCurrentOnUpdate?: boolean
}