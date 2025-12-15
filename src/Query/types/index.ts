import operatorEnum from "../enums/operator"

export type WhereObjType = {
    type: "basic"|"in"|"between"|"not_between"|"null"|"not_null", 
    column: string, 
    operator: operatorEnum|null, 
    value: any, 
    boolean: "and"|"or"
}

export type OrderObjType = {
    column: string, 
    direction: "asc"|"desc"
}

export type QueryObjType = {
    primaryKey: string,
    aggregate: { "function": "count"|"sum"|"avg"|"min"|"max", column: string }|null,
    selects: string[],
    distinct: boolean,
    from: string,
    wheres: WhereObjType[],
    groups: string[],
    havings: WhereObjType[],
    orders: OrderObjType[],
    limit: number|null,
    offset: number|null
}
